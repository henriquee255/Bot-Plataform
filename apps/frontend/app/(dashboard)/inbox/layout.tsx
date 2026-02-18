'use client';
import { useEffect } from 'react';
import { useConversationsStore } from '@/store/conversations.store';
import { conversationsApi } from '@/lib/api';
import { useSocket } from '@/components/socket-provider';
import ConversationListPanel from '@/components/inbox/conversation-list-panel';

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  const { setConversations, setLoading, upsertConversation, prependConversation } = useConversationsStore();
  const socket = useSocket();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Carrega todas as conversas (abertas + resolvidas)
        const data = await conversationsApi.list('all');
        setConversations(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Atualiza conversas em tempo real via socket
  useEffect(() => {
    if (!socket) return;

    function onNewConversation(conv: any) {
      prependConversation(conv);
    }

    function onConversationUpdated(conv: any) {
      upsertConversation(conv);
    }

    socket.on('conversation:new', onNewConversation);
    socket.on('conversation:updated', onConversationUpdated);
    socket.on('conversation:assigned', onConversationUpdated);

    return () => {
      socket.off('conversation:new', onNewConversation);
      socket.off('conversation:updated', onConversationUpdated);
      socket.off('conversation:assigned', onConversationUpdated);
    };
  }, [socket]);

  return (
    <div className="flex h-full">
      {/* Left: Conversation list */}
      <ConversationListPanel />

      {/* Center + Right: Chat area */}
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
