import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { RedemptionsService } from './redemptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('redemptions')
export class RedemptionsController {
  constructor(private readonly redemptionsService: RedemptionsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createRedemption(@Request() req, @Body() dto: any) {
    return this.redemptionsService.createRedemption(req.user.sub, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getRedemption(@Param('id') id: string) {
    return this.redemptionsService.getRedemption(id);
  }

  @Post(':id/redeem')
  @UseGuards(JwtAuthGuard)
  async redeemDrink(@Param('id') id: string) {
    return this.redemptionsService.redeemDrink(id);
  }
}
