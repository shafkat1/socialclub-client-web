import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateOrderDto, UpdateOrderStatusDto, ListOrdersQueryDto } from '../../common/dtos/orders.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ============================================
  // ORDER MANAGEMENT
  // ============================================
  @Post()
  async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.sub, dto);
  }

  @Get()
  async getUserOrders(@Request() req, @Query() query: ListOrdersQueryDto) {
    return this.ordersService.getUserOrders(req.user.sub, query);
  }

  @Get(':id')
  async getOrderDetails(@Param('id') orderId: string) {
    return this.ordersService.getOrderDetails(orderId);
  }

  @Post(':id/confirm-payment')
  async confirmPayment(@Param('id') orderId: string) {
    return this.ordersService.confirmPayment(orderId);
  }

  @Post(':id/status')
  async updateOrderStatus(@Request() req, @Param('id') orderId: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateOrderStatus(req.user.sub, orderId, dto);
  }

  // ============================================
  // REDEMPTION & QR CODE
  // ============================================
  @Post(':id/generate-qr')
  async generateRedemptionQR(@Param('id') orderId: string) {
    return this.ordersService.generateRedemptionQR(orderId);
  }

  @Post('redeem/:redemptionId')
  async redeemOrder(@Param('redemptionId') redemptionId: string) {
    return this.ordersService.redeemOrder(redemptionId);
  }
}
