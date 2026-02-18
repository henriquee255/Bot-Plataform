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
import { ContactSessionsService } from '../contacts/contact-sessions.service';

@WebSocketGateway({
  namespace: '/widget',
  cors: { origin: '*', credentials: true },
})
export class WidgetGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private contactSessionsService: ContactSessionsService) {}

  async handleConnection(client: Socket) {
    const token =
      client.handshake.query?.token as string ||
      client.handshake.auth?.token;

    if (!token) {
      client.disconnect();
      return;
    }

    const session = await this.contactSessionsService.findByToken(token);
    if (!session) {
      client.disconnect();
      return;
    }

    (client as any).session = session;

    // Join session-scoped room
    client.join(`widget:session:${token}`);
    client.join(`company:${session.company_id}`);
  }

  handleDisconnect(client: Socket) {
    // Session disconnect — no special cleanup needed
  }

  @SubscribeMessage('widget:join:conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conv:${data.conversationId}`);
  }

  @SubscribeMessage('widget:typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    // Notify agent namespace
    client.broadcast.to(`conv:${data.conversationId}`).emit('contact:typing', {
      conversationId: data.conversationId,
      isTyping: true,
    });
  }

  @SubscribeMessage('widget:typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.broadcast.to(`conv:${data.conversationId}`).emit('contact:typing', {
      conversationId: data.conversationId,
      isTyping: false,
    });
  }

  @SubscribeMessage('widget:message:read')
  handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; messageId: string },
  ) {
    client.broadcast.to(`conv:${data.conversationId}`).emit('message:status', {
      messageId: data.messageId,
      conversationId: data.conversationId,
      status: 'read',
      at: new Date().toISOString(),
    });
  }
}
