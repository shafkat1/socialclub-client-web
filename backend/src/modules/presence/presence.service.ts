import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';

@Injectable()
export class PresenceService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async setPresence(userId: string, dto: any) {
    // Update presence in database
    const presence = await this.prisma.presence.upsert({
      where: {
        userId_venueId: {
          userId,
          venueId: dto.venueId,
        },
      },
      update: {
        wantsToBuy: dto.wantsToBuy || false,
        wantsToReceive: dto.wantsToReceive || false,
        latitude: dto.latitude,
        longitude: dto.longitude,
        lastSeen: new Date(),
      },
      create: {
        userId,
        venueId: dto.venueId,
        wantsToBuy: dto.wantsToBuy || false,
        wantsToReceive: dto.wantsToReceive || false,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    // Update cache
    const cacheKey = `presence:${dto.venueId}`;
    await this.redis.del(cacheKey);

    return presence;
  }

  async clearPresence(userId: string, venueId: string) {
    await this.prisma.presence.deleteMany({
      where: {
        userId,
        venueId,
      },
    });

    // Update cache
    const cacheKey = `presence:${venueId}`;
    await this.redis.del(cacheKey);

    return { success: true };
  }

  async getVenuePresence(venueId: string) {
    const cacheKey = `presence:${venueId}`;
    
    // Try to get from cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get from database
    const presences = await this.prisma.presence.findMany({
      where: { venueId },
      include: { user: true },
    });

    // Cache for 5 minutes
    await this.redis.set(cacheKey, JSON.stringify(presences), 300);

    return presences;
  }
}
