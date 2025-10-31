import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // GROUP MANAGEMENT
  // ============================================
  async createGroup(userId: string, name?: string): Promise<any> {
    // Create group
    const group = await this.prisma.group.create({
      data: {
        name: name || `${userId}'s Group`,
        members: {
          create: {
            userId,
            isOwner: true,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                profileImage: true,
              },
            },
          },
        },
        venue: true,
      },
    });

    return group;
  }

  async getGroups(userId: string): Promise<any[]> {
    const groups = await this.prisma.group.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                profileImage: true,
                phoneVerified: true,
              },
            },
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return groups;
  }

  async getGroupDetails(groupId: string, userId: string): Promise<any> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                profileImage: true,
                phoneVerified: true,
              },
            },
          },
        },
        venue: true,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is member
    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new UnauthorizedException('Not a member of this group');
    }

    return group;
  }

  // ============================================
  // GROUP MEMBERSHIP
  // ============================================
  async addMember(groupId: string, userId: string, targetUserId: string): Promise<any> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Only owner can add members
    const isOwner = group.members.some((m) => m.userId === userId && m.isOwner);
    if (!isOwner) {
      throw new UnauthorizedException('Only group owner can add members');
    }

    // Check if target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already member
    const isMember = group.members.some((m) => m.userId === targetUserId);
    if (isMember) {
      throw new BadRequestException('User is already a member');
    }

    // Add member
    await this.prisma.groupMember.create({
      data: {
        groupId,
        userId: targetUserId,
      },
    });

    return { message: 'Member added successfully' };
  }

  async removeMember(groupId: string, userId: string, targetUserId: string): Promise<any> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Only owner can remove members (or user can remove themselves)
    if (userId !== targetUserId) {
      const isOwner = group.members.some((m) => m.userId === userId && m.isOwner);
      if (!isOwner) {
        throw new UnauthorizedException('Only group owner can remove members');
      }
    }

    // Remove member
    await this.prisma.groupMember.deleteMany({
      where: {
        groupId,
        userId: targetUserId,
      },
    });

    return { message: 'Member removed successfully' };
  }

  async leaveGroup(groupId: string, userId: string): Promise<any> {
    return this.removeMember(groupId, userId, userId);
  }

  // ============================================
  // GROUP VENUE
  // ============================================
  async setGroupVenue(groupId: string, userId: string, venueId: string): Promise<any> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Only owner can change venue
    const isOwner = group.members.some((m) => m.userId === userId && m.isOwner);
    if (!isOwner) {
      throw new UnauthorizedException('Only group owner can change venue');
    }

    // Validate venue
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // Update group
    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: { venueId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                profileImage: true,
              },
            },
          },
        },
        venue: true,
      },
    });

    return updated;
  }

  async clearGroupVenue(groupId: string, userId: string): Promise<any> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Only owner can clear venue
    const isOwner = group.members.some((m) => m.userId === userId && m.isOwner);
    if (!isOwner) {
      throw new UnauthorizedException('Only group owner can clear venue');
    }

    // Update group
    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: { venueId: null },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                profileImage: true,
              },
            },
          },
        },
        venue: true,
      },
    });

    return updated;
  }
}
