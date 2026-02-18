import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { UsersService } from '../modules/users/users.service';

@WebSocketGateway({
  namespace: '/agent',
  cors: { origin: '*', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private usersService: UsersService,
    @InjectRedis() private redis: Redis,
  ) {}

  private async redisSet(key: string, value: string, ttl: number) {
    try { await this.redis.set(key, value, 'EX', ttl); } catch {}
  }

  private async redisDel(key: string) {
    try { await this.redis.del(key); } catch {}
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');

      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });

      (client as any).user = payload;
      client.join(`company:${payload.companyId}`);
      client.join(`agent:${payload.sub}`);

      await this.redisSet(`agent:online:${payload.sub}`, '1', 45);

      this.server.to(`company:${payload.companyId}`).emit('presence:update', {
        agentId: payload.sub,
        status: 'online',
      });

      await this.usersService.updateLastSeen(payload.sub);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = (client as any).user;
    if (!user) return;

    await this.redisDel(`agent:online:${user.sub}`);

    this.server.to(`company:${user.companyId}`).emit('presence:update', {
      agentId: user.sub,
      status: 'offline',
    });
  }

  @SubscribeMessage('conversation:join')
  handleJoinConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.join(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.leave(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    const user = (client as any).user;
    client.to(`conversation:${data.conversationId}`).emit('agent:typing', {
      conversationId: data.conversationId,
      agentId: user?.sub,
      isTyping: true,
    });
    this.server.of('/widget').to(`conv:${data.conversationId}`).emit('agent:typing', {
      conversationId: data.conversationId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    const user = (client as any).user;
    client.to(`conversation:${data.conversationId}`).emit('agent:typing', {
      conversationId: data.conversationId,
      agentId: user?.sub,
      isTyping: false,
    });
    this.server.of('/widget').to(`conv:${data.conversationId}`).emit('agent:typing', {
      conversationId: data.conversationId,
      isTyping: false,
    });
  }

  @SubscribeMessage('message:read')
  handleMessageRead(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string; messageId: string }) {
    this.server.of('/widget').to(`conv:${data.conversationId}`).emit('message:status', {
      messageId: data.messageId,
      conversationId: data.conversationId,
      status: 'read',
      at: new Date().toISOString(),
    });
  }

  @SubscribeMessage('presence:ping')
  async handlePresencePing(@ConnectedSocket() client: Socket) {
    const user = (client as any).user;
    if (user) await this.redisSet(`agent:online:${user.sub}`, '1', 45);
  }

  @OnEvent('message.created')
  handleMessageCreated(payload: { message: any; conversationId: string; companyId: string }) {
    this.server.to(`company:${payload.companyId}`).emit('message:new', {
      conversationId: payload.conversationId,
      message: payload.message,
    });
    this.server.of('/widget').to(`conv:${payload.conversationId}`).emit('message:new', {
      conversationId: payload.conversationId,
      message: payload.message,
    });
  }

  @OnEvent('conversation.updated')
  handleConversationUpdated(payload: { conversation: any; companyId: string }) {
    this.server.to(`company:${payload.companyId}`).emit('conversation:updated', {
      conversation: payload.conversation,
    });
  }
}
