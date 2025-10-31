import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import Stripe from 'stripe';
import { CreateOrderDto, UpdateOrderStatusDto, OrderResponseDto, ListOrdersQueryDto } from '../../common/dtos/orders.dto';
import * as QRCode from 'qrcode';

@Injectable()
export class OrdersService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-10-28' as any,
    });
  }

  // ============================================
  // ORDER CREATION & PAYMENT
  // ============================================
  async createOrder(buyerId: string, dto: CreateOrderDto): Promise<OrderResponseDto> {
    // Validate recipient exists
    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    // Validate venue exists
    const venue = await this.prisma.venue.findUnique({
      where: { id: dto.venueId },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // Validate buyer is not the recipient
    if (buyerId === dto.recipientId) {
      throw new BadRequestException('Cannot buy a drink for yourself');
    }

    // Create Stripe payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: dto.amount, // already in cents
      currency: 'usd',
      payment_method_types: ['card', 'apple_pay', 'google_pay'],
      metadata: {
        buyerId,
        recipientId: dto.recipientId,
        venueId: dto.venueId,
      },
    });

    // Create order in database
    const order = await this.prisma.order.create({
      data: {
        buyerId,
        recipientId: dto.recipientId,
        venueId: dto.venueId,
        amount: dto.amount,
        currency: 'USD',
        status: 'PENDING',
        paymentMethod: (dto.paymentMethod as any) || 'STRIPE',
        stripePaymentIntentId: paymentIntent.id,
        message: dto.message,
      },
    });

    // Cache in Redis for quick lookups
    await this.redis.set(
      `order:${order.id}`,
      JSON.stringify(order),
      86400, // 24 hours
    );

    return this.mapOrderToResponse(order);
  }

  // ============================================
  // ORDER STATUS MANAGEMENT
  // ============================================
  async confirmPayment(orderId: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify payment with Stripe
    if (order.stripePaymentIntentId) {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        order.stripePaymentIntentId,
      );

      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException('Payment not confirmed');
      }
    }

    // Update order status to PAID
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    });

    // Clear cache
    await this.redis.del(`order:${orderId}`);

    return this.mapOrderToResponse(updated);
  }

  async updateOrderStatus(buyerId: string, orderId: string, dto: UpdateOrderStatusDto): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only recipient can accept/reject, only buyer can cancel
    if (dto.status === 'CANCELLED' && order.buyerId !== buyerId) {
      throw new UnauthorizedException('Only buyer can cancel order');
    }

    if ((dto.status === 'ACCEPTED' || dto.status === 'REJECTED') && order.recipientId !== buyerId) {
      throw new UnauthorizedException('Only recipient can accept/reject order');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status as any },
    });

    // Clear cache
    await this.redis.del(`order:${orderId}`);

    return this.mapOrderToResponse(updated);
  }

  // ============================================
  // ORDER RETRIEVAL
  // ============================================
  async getUserOrders(userId: string, dto: ListOrdersQueryDto): Promise<OrderResponseDto[]> {
    const limit = Math.min(dto.limit || 20, 100);
    const offset = dto.offset || 0;

    const orders = await this.prisma.order.findMany({
      where: {
        OR: [{ buyerId: userId }, { recipientId: userId }],
        ...(dto.status && { status: dto.status as any }),
        ...(dto.venueId && { venueId: dto.venueId }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return orders.map((order) => this.mapOrderToResponse(order));
  }

  async getOrderDetails(orderId: string): Promise<OrderResponseDto> {
    const cached = await this.redis.get(`order:${orderId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const response = this.mapOrderToResponse(order);

    // Cache it
    await this.redis.set(`order:${orderId}`, JSON.stringify(response), 86400);

    return response;
  }

  // ============================================
  // REDEMPTION & QR CODE
  // ============================================
  async generateRedemptionQR(orderId: string): Promise<{ qrCode: string; redemptionId: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'ACCEPTED') {
      throw new BadRequestException('Order must be accepted before generating QR code');
    }

    // Create redemption record
    const redemption = await this.prisma.redemption.create({
      data: {
        bartenderId: order.buyerId, // For now, buyer acts as bartender-like
        qrCode: `${orderId}:${Date.now()}`,
        status: 'PENDING',
      },
    });

    // Link order to redemption
    await this.prisma.order.update({
      where: { id: orderId },
      data: { redemptionId: redemption.id },
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(redemption.qrCode);

    return {
      qrCode,
      redemptionId: redemption.id,
    };
  }

  async redeemOrder(redemptionId: string): Promise<{ message: string }> {
    const redemption = await this.prisma.redemption.findUnique({
      where: { id: redemptionId },
    });

    if (!redemption) {
      throw new NotFoundException('Redemption not found');
    }

    if (redemption.status === 'REDEEMED') {
      throw new BadRequestException('This drink has already been redeemed');
    }

    // Update redemption
    await this.prisma.redemption.update({
      where: { id: redemptionId },
      data: {
        status: 'REDEEMED',
        redeemedAt: new Date(),
      },
    });

    // Update order status
    const order = await this.prisma.order.findFirst({
      where: { redemptionId },
    });

    if (order) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'REDEEMED' },
      });

      // Clear cache
      await this.redis.del(`order:${order.id}`);
    }

    return { message: 'Drink redeemed successfully' };
  }

  // ============================================
  // HELPERS
  // ============================================
  private mapOrderToResponse(order: any): OrderResponseDto {
    return {
      id: order.id,
      buyerId: order.buyerId,
      recipientId: order.recipientId,
      venueId: order.venueId,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      paymentMethod: order.paymentMethod,
      message: order.message,
      createdAt: order.createdAt,
      expiresAt: order.expiresAt,
    };
  }
}
