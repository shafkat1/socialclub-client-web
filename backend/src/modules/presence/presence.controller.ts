import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('presence')
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Post('set')
  @UseGuards(JwtAuthGuard)
  async setPresence(@Request() req, @Body() dto: any) {
    return this.presenceService.setPresence(req.user.sub, dto);
  }

  @Delete('clear/:venueId')
  @UseGuards(JwtAuthGuard)
  async clearPresence(@Request() req, @Param('venueId') venueId: string) {
    return this.presenceService.clearPresence(req.user.sub, venueId);
  }

  @Get(':venueId')
  async getVenuePresence(@Param('venueId') venueId: string) {
    return this.presenceService.getVenuePresence(venueId);
  }
}
