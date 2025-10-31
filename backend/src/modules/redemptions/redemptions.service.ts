import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class RedemptionsService {
  constructor(private prisma: PrismaService) {}

  async createRedemption(userId: string, dto: any) {
    // Verify order exists and belongs to user
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.recipientId !== userId) {
      throw new BadRequestException('You are not the recipient of this order');
    }

    // Create redemption record
    const redemption = await this.prisma.redemption.create({
      data: {
        bartenderId: dto.bartenderId,
        qrCode: dto.qrCode,
        status: 'PENDING',
      },
    });

    return redemption;
  }

  async getRedemption(redemptionId: string) {
    const redemption = await this.prisma.redemption.findUnique({
      where: { id: redemptionId },
      include: { orders: true },
    });

    if (!redemption) {
      throw new NotFoundException('Redemption not found');
    }

    return redemption;
  }

  async redeemDrink(redemptionId: string) {
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

    return { success: true, message: 'Drink redeemed successfully' };
  }
}
