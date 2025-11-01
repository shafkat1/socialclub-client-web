resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-ecs"
}

resource "aws_ecs_cluster" "prod" {
  name = "clubapp-prod"
}

resource "aws_lb" "app" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [for s in aws_subnet.public : s.id]
}

resource "aws_lb_target_group" "app" {
  name        = "${local.name_prefix}-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  health_check {
    path = "/health"
  }
}

resource "aws_lb_listener" "http" {
  count             = var.enable_domain ? 0 : 1
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_ecs_task_definition" "placeholder" {
  family                   = "${local.name_prefix}-svc"
  cpu                      = "256"
  memory                   = "512"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  container_definitions    = jsonencode([
    {
      name      = "web"
      image     = "public.ecr.aws/docker/library/nginx:stable"
      essential = true
      portMappings = [{ containerPort = 3000, hostPort = 3000 }]
      command = ["/bin/sh", "-c", "printf 'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nhealthy' > /usr/share/nginx/html/health && nginx -g 'daemon off;' "]
    }
  ])
}

resource "aws_ecs_service" "placeholder" {
  name            = "${local.name_prefix}-svc"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.placeholder.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = [for s in aws_subnet.public : s.id]
    security_groups = [aws_security_group.services.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "web"
    container_port   = 3000
  }

  depends_on = [aws_lb_target_group.app]
}

# Minimal production cluster/service to satisfy deployments (kept at zero tasks to minimise cost)
resource "aws_ecs_task_definition" "prod_placeholder" {
  family                   = "clubapp-backend-prod"
  cpu                      = "256"
  memory                   = "512"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = "arn:aws:iam::425687053209:role/ecsTaskExecutionRole"
  task_role_arn            = "arn:aws:iam::425687053209:role/ecsTaskRole"

  container_definitions = jsonencode([
    {
      name      = "clubapp-backend"
      image     = "public.ecr.aws/docker/library/nginx:stable"
      essential = true
      portMappings = [{
        containerPort = 3001
        hostPort      = 3001
        protocol      = "tcp"
      }]
      command = [
        "/bin/sh",
        "-c",
        "printf 'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nhealthy' > /usr/share/nginx/html/health && nginx -g 'daemon off;' "
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/clubapp-backend"
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "prod_placeholder" {
  name            = "clubapp-backend-prod"
  cluster         = aws_ecs_cluster.prod.id
  task_definition = aws_ecs_task_definition.prod_placeholder.arn
  desired_count   = 0
  launch_type     = "FARGATE"

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  network_configuration {
    subnets         = [for s in aws_subnet.public : s.id]
    security_groups = [aws_security_group.services.id]
    assign_public_ip = true
  }
}
