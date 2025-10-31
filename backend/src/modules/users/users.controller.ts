import { Controller, Get, Patch, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { UsersService, UpdateProfileDto } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ============================================
  // PROFILE
  // ============================================
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.sub, dto);
  }

  @Get(':id')
  async getUserById(@Param('id') userId: string) {
    return this.usersService.getUserById(userId);
  }

  // ============================================
  // SEARCH & DISCOVERY
  // ============================================
  @Get('search')
  async searchUsers(
    @Query('q') query: string,
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
  ) {
    return this.usersService.searchUsers(query, parseInt(limit), parseInt(offset));
  }

  // ============================================
  // STATISTICS
  // ============================================
  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getUserStats(@Request() req) {
    return this.usersService.getUserStats(req.user.sub);
  }

  // ============================================
  // FRIENDS
  // ============================================
  @Get('me/friends')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getFriends(@Request() req) {
    return this.usersService.getFriends(req.user.sub);
  }

  // ============================================
  // DEVICES
  // ============================================
  @Post('me/devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async registerDevice(
    @Request() req,
    @Body() body: {
      deviceToken: string;
      platform: string;
      appVersion?: string;
      osVersion?: string;
    },
  ) {
    return this.usersService.registerDevice(
      req.user.sub,
      body.deviceToken,
      body.platform,
      body.appVersion,
      body.osVersion,
    );
  }

  @Get('me/devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getUserDevices(@Request() req) {
    return this.usersService.getUserDevices(req.user.sub);
  }

  @Delete('me/devices/:deviceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async removeDevice(@Request() req, @Param('deviceId') deviceId: string) {
    return this.usersService.removeDevice(req.user.sub, deviceId);
  }
}
