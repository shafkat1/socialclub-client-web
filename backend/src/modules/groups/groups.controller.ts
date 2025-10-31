import { Controller, Post, Get, Body, Param, UseGuards, Request, Delete, Patch } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Groups')
@Controller('groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // ============================================
  // GROUP MANAGEMENT
  // ============================================
  @Post()
  async createGroup(@Request() req, @Body() body: { name?: string }) {
    return this.groupsService.createGroup(req.user.sub, body.name);
  }

  @Get()
  async getGroups(@Request() req) {
    return this.groupsService.getGroups(req.user.sub);
  }

  @Get(':id')
  async getGroupDetails(@Request() req, @Param('id') groupId: string) {
    return this.groupsService.getGroupDetails(groupId, req.user.sub);
  }

  // ============================================
  // GROUP MEMBERSHIP
  // ============================================
  @Post(':id/members')
  async addMember(@Request() req, @Param('id') groupId: string, @Body() body: { userId: string }) {
    return this.groupsService.addMember(groupId, req.user.sub, body.userId);
  }

  @Delete(':id/members/:userId')
  async removeMember(@Request() req, @Param('id') groupId: string, @Param('userId') userId: string) {
    return this.groupsService.removeMember(groupId, req.user.sub, userId);
  }

  @Post(':id/leave')
  async leaveGroup(@Request() req, @Param('id') groupId: string) {
    return this.groupsService.leaveGroup(groupId, req.user.sub);
  }

  // ============================================
  // GROUP VENUE
  // ============================================
  @Patch(':id/venue')
  async setGroupVenue(@Request() req, @Param('id') groupId: string, @Body() body: { venueId: string }) {
    return this.groupsService.setGroupVenue(groupId, req.user.sub, body.venueId);
  }

  @Post(':id/venue/clear')
  async clearGroupVenue(@Request() req, @Param('id') groupId: string) {
    return this.groupsService.clearGroupVenue(groupId, req.user.sub);
  }
}
