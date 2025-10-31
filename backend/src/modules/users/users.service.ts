import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { S3Service } from '../../common/services/s3.service';

export class UpdateProfileDto {
  displayName?: string;
  bio?: string;
  profileImage?: string; // base64 or URL
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
  ) {}

  // ============================================
  // PROFILE MANAGEMENT
  // ============================================
  async getProfile(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        displayName: true,
        profileImage: true,
        bio: true,
        phoneVerified: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let profileImageUrl = user.profileImage;

    // Handle profile image upload if provided
    if (dto.profileImage && dto.profileImage.startsWith('data:')) {
      try {
        // Convert base64 to buffer
        const base64Data = dto.profileImage.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Upload to S3
        profileImageUrl = await this.s3.upload(
          process.env.S3_BUCKET || 'club-app',
          `profile-images/${userId}/${Date.now()}.jpg`,
          buffer,
          'image/jpeg',
        );
      } catch (error) {
        console.error('Profile image upload failed:', error);
        throw new BadRequestException('Failed to upload profile image');
      }
    }

    // Update user
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName ?? user.displayName,
        bio: dto.bio ?? user.bio,
        profileImage: profileImageUrl,
      },
      select: {
        id: true,
        phone: true,
        email: true,
        displayName: true,
        profileImage: true,
        bio: true,
        phoneVerified: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return updated;
  }

  // ============================================
  // USER DISCOVERY
  // ============================================
  async searchUsers(query: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { displayName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        displayName: true,
        profileImage: true,
        phoneVerified: true,
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  async getUserById(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        profileImage: true,
        bio: true,
        phoneVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ============================================
  // USER STATISTICS
  // ============================================
  async getUserStats(userId: string): Promise<any> {
    const [sentOrders, receivedOrders, groups, presences] = await Promise.all([
      this.prisma.order.count({ where: { buyerId: userId } }),
      this.prisma.order.count({ where: { recipientId: userId } }),
      this.prisma.group.count({
        where: { members: { some: { userId } } },
      }),
      this.prisma.presence.count({ where: { userId } }),
    ]);

    return {
      totalDrinksSent: sentOrders,
      totalDrinksReceived: receivedOrders,
      groupsCount: groups,
      recentVenues: presences,
    };
  }

  // ============================================
  // FRIEND/CONTACT MANAGEMENT
  // ============================================
  async getFriends(userId: string): Promise<any[]> {
    // Get all users the current user has interacted with
    const interactions = await this.prisma.order.findMany({
      where: {
        OR: [{ buyerId: userId }, { recipientId: userId }],
      },
      select: {
        buyerId: true,
        recipientId: true,
      },
      distinct: ['buyerId', 'recipientId'],
    });

    // Collect unique friend IDs
    const friendIds = new Set<string>();
    interactions.forEach((order) => {
      if (order.buyerId !== userId) friendIds.add(order.buyerId);
      if (order.recipientId !== userId) friendIds.add(order.recipientId);
    });

    // Get friend details
    const friends = await this.prisma.user.findMany({
      where: { id: { in: Array.from(friendIds) } },
      select: {
        id: true,
        displayName: true,
        profileImage: true,
        phoneVerified: true,
      },
    });

    return friends;
  }

  // ============================================
  // DEVICE MANAGEMENT
  // ============================================
  async registerDevice(userId: string, deviceToken: string, platform: string, appVersion?: string, osVersion?: string): Promise<any> {
    const device = await this.prisma.device.upsert({
      where: {
        userId_deviceToken: {
          userId,
          deviceToken,
        },
      },
      create: {
        userId,
        deviceToken,
        platform,
        appVersion,
        osVersion,
      },
      update: {
        lastUsedAt: new Date(),
      },
    });

    return device;
  }

  async getUserDevices(userId: string): Promise<any[]> {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  async removeDevice(userId: string, deviceId: string): Promise<{ message: string }> {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.userId !== userId) {
      throw new NotFoundException('Device not found');
    }

    await this.prisma.device.delete({ where: { id: deviceId } });

    return { message: 'Device removed' };
  }
}
