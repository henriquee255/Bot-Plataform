'use client';
import { createContext, useContext, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';
import { useConversationsStore } from '@/store/conversations.store';
import { useMessagesStore } from '@/store/messages.store';

const SocketContext = createContext<Socket | null>(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const { upsertConversation } = useConversationsStore();
  const { appendMessage, updateMessageStatus, setTyping } = useMessagesStore();

  useEffect(() => {
    if (!accessToken) return;

    const socket = getSocket(accessToken);
    socketRef.current = socket;

    socket.on('message:new', ({ conversationId, message, conversation }) => {
      appendMessage(conversationId, message);
      if (conversation) upsertConversation(conversation);
    });

    socket.on('conversation:updated', ({ conversation }) => {
      upsertConversation(conversation);
    });

    socket.on('contact:typing', ({ conversationId, isTyping }) => {
      setTyping(conversationId, { isTyping });
    });

    socket.on('agent:typing', ({ conversationId, agentId, agentName, isTyping }) => {
      setTyping(conversationId, { isTyping, agentId, agentName });
    });

    socket.on('message:status', ({ messageId, status }) => {
      updateMessageStatus(messageId, status);
    });

    // Send presence ping every 30s
    const presenceInterval = setInterval(() => {
      socket.emit('presence:ping');
    }, 30_000);

    return () => {
      clearInterval(presenceInterval);
      socket.off('message:new');
      socket.off('conversation:updated');
      socket.off('contact:typing');
      socket.off('agent:typing');
      socket.off('message:status');
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      disconnectSocket();
    }
  }, [accessToken]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}
