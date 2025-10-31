import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { SearchVenuesDto, VenueListResponseDto, VenueDetailsResponseDto, SetPresenceDto, PresenceResponseDto } from '../../common/dtos/venue.dto';
import axios from 'axios';

@Injectable()
export class VenuesService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // ============================================
  // GOOGLE PLACES API INTEGRATION (NEW)
  // ============================================
  async getNearbyVenuesFromGooglePlaces(
    latitude: number,
    longitude: number,
    type: string = 'restaurant',
    radius: number = 8047,
  ) {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_MAPS_API_KEY not configured');
      }

      // Call Google Places API
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
        {
          params: {
            location: `${latitude},${longitude}`,
            radius: radius,
            type: type,
            key: apiKey,
          },
        }
      );

      if (!response.data.results) {
        return [];
      }

      // Map results to standard format
      return response.data.results.map((place: any) => ({
        id: place.place_id,
        name: place.name,
        type: type,
        address: place.vicinity || place.formatted_address || 'N/A',
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating,
        reviewCount: place.user_ratings_total,
        openNow: place.opening_hours?.open_now,
        phone: place.formatted_phone_number,
        website: place.website,
        photos: place.photos?.map((p: any) => p.photo_reference) || [],
      }));
    } catch (error) {
      console.error('Error fetching nearby venues from Google Places:', error);
      throw new BadRequestException(
        `Failed to fetch nearby venues: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async searchGooglePlaces(
    query: string,
    latitude: number,
    longitude: number,
    radius: number = 8047,
  ) {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_MAPS_API_KEY not configured');
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/textsearch/json',
        {
          params: {
            query: query,
            location: `${latitude},${longitude}`,
            radius: radius,
            key: apiKey,
          },
        }
      );

      if (!response.data.results) {
        return [];
      }

      return response.data.results.map((place: any) => ({
        id: place.place_id,
        name: place.name,
        type: 'mixed',
        address: place.formatted_address || 'N/A',
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating,
        reviewCount: place.user_ratings_total,
        openNow: undefined,
        phone: place.formatted_phone_number,
        website: place.website,
        photos: place.photos?.map((p: any) => p.photo_reference) || [],
      }));
    } catch (error) {
      console.error('Error searching Google Places:', error);
      throw new BadRequestException(
        `Failed to search places: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ============================================
  // VENUE SEARCH & DISCOVERY
  // ============================================
  async searchVenues(dto: SearchVenuesDto): Promise<VenueListResponseDto[]> {
    const radiusKm = dto.radiusKm || 5;
    const limit = Math.min(dto.limit || 20, 100);
    const offset = dto.offset || 0;

    // Use Haversine formula for distance calculation
    // PostGIS would be ideal, but using raw SQL for now
    const venues = await this.prisma.$queryRaw`
      SELECT 
        id, name, latitude, longitude, address, city, "coverImage",
        (
          6371 * acos(
            cos(radians(${dto.latitude})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${dto.longitude})) +
            sin(radians(${dto.latitude})) * sin(radians(latitude))
          )
        ) AS distance
      FROM "Venue"
      WHERE (
        6371 * acos(
          cos(radians(${dto.latitude})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${dto.longitude})) +
          sin(radians(${dto.latitude})) * sin(radians(latitude))
        )
      ) <= ${radiusKm}
      ${dto.search ? `AND (name ILIKE ${'%' + dto.search + '%'} OR address ILIKE ${'%' + dto.search + '%'})` : ''}
      ORDER BY distance ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Enrich with real-time presence data
    const venuesWithPresence = await Promise.all(
      (venues as any[]).map(async (venue: any) => this.enrichVenueWithPresence(venue)),
    );

    return venuesWithPresence;
  }

  async getVenueDetails(venueId: string): Promise<VenueDetailsResponseDto> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    return this.enrichVenueDetailsWithPresence(venue);
  }

  // ============================================
  // PRESENCE MANAGEMENT
  // ============================================
  async setPresence(userId: string, dto: SetPresenceDto): Promise<PresenceResponseDto> {
    // Validate venue exists
    const venue = await this.prisma.venue.findUnique({
      where: { id: dto.venueId },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Upsert presence record
    const presence = await this.prisma.presence.upsert({
      where: {
        userId_venueId: {
          userId,
          venueId: dto.venueId,
        },
      },
      create: {
        userId,
        venueId: dto.venueId,
        wantsToBuy: dto.wantsToBuy ?? false,
        wantsToReceive: dto.wantsToReceive ?? false,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
      update: {
        wantsToBuy: dto.wantsToBuy !== undefined ? dto.wantsToBuy : undefined,
        wantsToReceive: dto.wantsToReceive !== undefined ? dto.wantsToReceive : undefined,
        latitude: dto.latitude,
        longitude: dto.longitude,
        lastSeen: new Date(),
      },
    });

    // Also cache in Redis for real-time queries
    const presenceCacheKey = `presence:${dto.venueId}:${userId}`;
    await this.redis.set(
      presenceCacheKey,
      JSON.stringify({
        userId,
        wantsToBuy: presence.wantsToBuy,
        wantsToReceive: presence.wantsToReceive,
        lastSeen: new Date(),
      }),
      86400, // 24 hours
    );

    // Update venue counts in Redis
    await this.updateVenueCounts(dto.venueId);

    return this.mapPresenceToResponse(presence, user);
  }

  async clearPresence(userId: string, venueId: string): Promise<{ message: string }> {
    // Delete presence record
    await this.prisma.presence.delete({
      where: {
        userId_venueId: {
          userId,
          venueId,
        },
      },
    }).catch(() => {
      // Ignore if not found
    });

    // Remove from Redis cache
    const presenceCacheKey = `presence:${venueId}:${userId}`;
    await this.redis.del(presenceCacheKey);

    // Update venue counts
    await this.updateVenueCounts(venueId);

    return { message: 'Presence cleared' };
  }

  async getVenuePresence(venueId: string): Promise<PresenceResponseDto[]> {
    const presences = await this.prisma.presence.findMany({
      where: { venueId },
      include: { user: true },
    });

    return Promise.all(
      presences.map((p) => this.mapPresenceToResponse(p, p.user)),
    );
  }

  // ============================================
  // REAL-TIME COUNTS (REDIS-BACKED)
  // ============================================
  private async updateVenueCounts(venueId: string): Promise<void> {
    const presences = await this.prisma.presence.findMany({
      where: { venueId },
    });

    const buysCount = presences.filter((p) => p.wantsToBuy).length;
    const receivesCount = presences.filter((p) => p.wantsToReceive).length;
    const totalCount = presences.length;

    const countsKey = `venue:counts:${venueId}`;
    await this.redis.set(
      countsKey,
      JSON.stringify({
        total: totalCount,
        buys: buysCount,
        receives: receivesCount,
        lastUpdated: new Date(),
      }),
      3600, // 1 hour
    );
  }

  private async getVenueCounts(venueId: string): Promise<{ total: number; buys: number; receives: number }> {
    const countsKey = `venue:counts:${venueId}`;
    const cached = await this.redis.get(countsKey);

    if (cached) {
      const counts = JSON.parse(cached);
      return {
        total: counts.total || 0,
        buys: counts.buys || 0,
        receives: counts.receives || 0,
      };
    }

    // Fallback to database query
    const presences = await this.prisma.presence.findMany({
      where: { venueId },
    });

    const buysCount = presences.filter((p) => p.wantsToBuy).length;
    const receivesCount = presences.filter((p) => p.wantsToReceive).length;

    return {
      total: presences.length,
      buys: buysCount,
      receives: receivesCount,
    };
  }

  // ============================================
  // HELPERS
  // ============================================
  private async enrichVenueWithPresence(venue: any): Promise<VenueListResponseDto> {
    const counts = await this.getVenueCounts(venue.id);
    return {
      id: venue.id,
      name: venue.name,
      latitude: venue.latitude,
      longitude: venue.longitude,
      address: venue.address,
      coverImage: venue.coverImage,
      distance: Math.round(venue.distance * 100) / 100, // Round to 2 decimals
      presenceCount: counts.total,
      buysCount: counts.buys,
      receivesCount: counts.receives,
    };
  }

  private async enrichVenueDetailsWithPresence(venue: any): Promise<VenueDetailsResponseDto> {
    const counts = await this.getVenueCounts(venue.id);
    return {
      id: venue.id,
      name: venue.name,
      description: venue.description,
      latitude: venue.latitude,
      longitude: venue.longitude,
      address: venue.address,
      city: venue.city,
      coverImage: venue.coverImage,
      presenceCount: counts.total,
      buysCount: counts.buys,
      receivesCount: counts.receives,
      createdAt: venue.createdAt,
    };
  }

  private async mapPresenceToResponse(presence: any, user: any): Promise<PresenceResponseDto> {
    return {
      userId: user.id,
      displayName: user.displayName || 'Anonymous',
      profileImage: user.profileImage,
      venueId: presence.venueId,
      wantsToBuy: presence.wantsToBuy,
      wantsToReceive: presence.wantsToReceive,
      lastSeen: presence.lastSeen,
    };
  }
}
