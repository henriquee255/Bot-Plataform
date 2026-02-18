import { io, Socket } from 'socket.io-client';

export class WidgetSocket {
  private socket: Socket | null = null;

  connect(serverUrl: string, sessionToken: string): Socket {
    this.socket = io(`${serverUrl}/widget`, {
      query: { token: sessionToken },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    return this.socket;
  }

  joinConversation(conversationId: string): void {
    this.socket?.emit('widget:join:conversation', { conversationId });
  }

  sendTypingStart(conversationId: string): void {
    this.socket?.emit('widget:typing:start', { conversationId });
  }

  sendTypingStop(conversationId: string): void {
    this.socket?.emit('widget:typing:stop', { conversationId });
  }

  on(event: string, handler: (...args: any[]) => void): void {
    this.socket?.on(event, handler);
  }

  off(event: string): void {
    this.socket?.off(event);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
