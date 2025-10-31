import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('RealtimeGateway');
  private userSockets = new Map<string, string[]>(); // userId -> [socketIds]

  constructor(private jwtService: JwtService) {}

  afterInit(_server: Server) {
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket, ..._args: any[]) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Track socket connection per user
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId).push(client.id);

      client.data.userId = userId;

      // Join user-specific room for private notifications
      client.join(`user:${userId}`);

      this.logger.log(`Client ${client.id} connected for user ${userId}`);
    } catch (error) {
      this.logger.error('Auth error on connection', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId) || [];
      const index = sockets.indexOf(client.id);
      if (index > -1) {
        sockets.splice(index, 1);
      }

      if (sockets.length === 0) {
        this.userSockets.delete(userId);
      }

      this.logger.log(`Client ${client.id} disconnected for user ${userId}`);
    }
  }

  // ============================================
  // VENUE PRESENCE
  // ============================================
  @SubscribeMessage('venue:join')
  handleVenueJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { venueId: string; wantsToBuy?: boolean; wantsToReceive?: boolean },
  ) {
    const userId = client.data.userId;

    // Join venue-specific room
    client.join(`venue:${data.venueId}`);

    // Broadcast user joined venue
    this.server.to(`venue:${data.venueId}`).emit('venue:user-joined', {
      userId,
      venueId: data.venueId,
      wantsToBuy: data.wantsToBuy || false,
      wantsToReceive: data.wantsToReceive || false,
      timestamp: new Date(),
    });

    this.logger.log(`User ${userId} joined venue ${data.venueId}`);
  }

  @SubscribeMessage('venue:leave')
  handleVenueLeave(@ConnectedSocket() client: Socket, @MessageBody() data: { venueId: string }) {
    const userId = client.data.userId;

    // Leave venue room
    client.leave(`venue:${data.venueId}`);

    // Broadcast user left venue
    this.server.to(`venue:${data.venueId}`).emit('venue:user-left', {
      userId,
      venueId: data.venueId,
      timestamp: new Date(),
    });

    this.logger.log(`User ${userId} left venue ${data.venueId}`);
  }

  @SubscribeMessage('venue:counts')
  handleVenueCountsUpdate(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { venueId: string; buysCount: number; receivesCount: number; totalCount: number },
  ) {
    // Broadcast updated counts to all users in venue
    this.server.to(`venue:${data.venueId}`).emit('venue:counts-updated', {
      venueId: data.venueId,
      counts: {
        total: data.totalCount,
        buys: data.buysCount,
        receives: data.receivesCount,
      },
      timestamp: new Date(),
    });
  }

  // ============================================
  // ORDER NOTIFICATIONS
  // ============================================
  @SubscribeMessage('order:created')
  handleOrderCreated(
    @ConnectedSocket() _client: Socket,
    @MessageBody()
    data: {
      orderId: string;
      buyerId: string;
      recipientId: string;
      venueId: string;
      amount: number;
      message?: string;
    },
  ) {
    // Notify recipient of new order
    this.server.to(`user:${data.recipientId}`).emit('order:received', {
      orderId: data.orderId,
      buyerId: data.buyerId,
      venueId: data.venueId,
      amount: data.amount,
      message: data.message,
      timestamp: new Date(),
    });

    this.logger.log(`Order ${data.orderId} notified to user ${data.recipientId}`);
  }

  @SubscribeMessage('order:status-updated')
  handleOrderStatusUpdated(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { orderId: string; buyerId: string; recipientId: string; status: string },
  ) {
    // Notify both buyer and recipient of status change
    this.server.to(`user:${data.buyerId}`).emit('order:status-changed', {
      orderId: data.orderId,
      status: data.status,
      timestamp: new Date(),
    });

    this.server.to(`user:${data.recipientId}`).emit('order:status-changed', {
      orderId: data.orderId,
      status: data.status,
      timestamp: new Date(),
    });

    this.logger.log(`Order ${data.orderId} status updated to ${data.status}`);
  }

  // ============================================
  // REDEMPTION NOTIFICATIONS
  // ============================================
  @SubscribeMessage('redemption:ready')
  handleRedemptionReady(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { redemptionId: string; orderId: string; recipientId: string; qrCode: string },
  ) {
    // Notify recipient that QR code is ready to scan
    this.server.to(`user:${data.recipientId}`).emit('redemption:show-qr', {
      redemptionId: data.redemptionId,
      orderId: data.orderId,
      qrCode: data.qrCode,
      timestamp: new Date(),
    });

    this.logger.log(`Redemption QR ready for user ${data.recipientId}`);
  }

  @SubscribeMessage('redemption:completed')
  handleRedemptionCompleted(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { redemptionId: string; orderId: string; recipientId: string },
  ) {
    // Notify recipient of successful redemption
    this.server.to(`user:${data.recipientId}`).emit('redemption:completed', {
      redemptionId: data.redemptionId,
      orderId: data.orderId,
      timestamp: new Date(),
    });

    this.logger.log(`Redemption ${data.redemptionId} completed`);
  }

  // ============================================
  // UTILITIES
  // ============================================
  broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  broadcastToVenue(venueId: string, event: string, data: any) {
    this.server.to(`venue:${venueId}`).emit(event, data);
  }

  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
