import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  recipientId: string;

  @IsString()
  venueId: string;

  @IsNumber()
  amount: number; // in cents

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsEnum(['STRIPE', 'APPLE_PAY', 'GOOGLE_PAY'])
  paymentMethod?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(['ACCEPTED', 'REJECTED', 'CANCELLED'])
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class RedeemOrderDto {
  @IsString()
  orderId: string;
}

export class OrderResponseDto {
  id: string;
  buyerId: string;
  recipientId: string;
  venueId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  message?: string;
  createdAt: Date;
  expiresAt: Date;
}

export class ListOrdersQueryDto {
  @IsOptional()
  @IsEnum(['PENDING', 'PAID', 'ACCEPTED', 'REDEEMED', 'EXPIRED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsString()
  venueId?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}
