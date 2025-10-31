import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { VenuesService } from './venues.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SearchVenuesDto, SetPresenceDto } from '../../common/dtos/venue.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Venues')
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  // ============================================
  // GOOGLE PLACES API INTEGRATION (NEW)
  // ============================================
  @Get('nearby')
  async getNearbyVenues(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('type') type: string = 'restaurant',
    @Query('radius') radius: number = 8047,
  ) {
    return this.venuesService.getNearbyVenuesFromGooglePlaces(latitude, longitude, type, radius);
  }

  @Get('search-places')
  async searchPlaces(
    @Query('query') query: string,
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number = 8047,
  ) {
    return this.venuesService.searchGooglePlaces(query, latitude, longitude, radius);
  }

  // ============================================
  // SEARCH & DISCOVERY
  // ============================================
  @Post('search')
  async searchVenues(@Body() dto: SearchVenuesDto) {
    return this.venuesService.searchVenues(dto);
  }

  @Get(':id')
  async getVenueDetails(@Param('id') venueId: string) {
    return this.venuesService.getVenueDetails(venueId);
  }

  // ============================================
  // PRESENCE MANAGEMENT
  // ============================================
  @Post('presence/set')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async setPresence(@Request() req, @Body() dto: SetPresenceDto) {
    return this.venuesService.setPresence(req.user.sub, dto);
  }

  @Post('presence/clear')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async clearPresence(@Request() req, @Query('venueId') venueId: string) {
    return this.venuesService.clearPresence(req.user.sub, venueId);
  }

  @Get(':id/presence')
  async getVenuePresence(@Param('id') venueId: string) {
    return this.venuesService.getVenuePresence(venueId);
  }
}
