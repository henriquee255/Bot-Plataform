'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { conversationsApi, messagesApi } from '@/lib/api';
import { useConversationsStore } from '@/store/conversations.store';
import { useMessagesStore } from '@/store/messages.store';
import { useSocket } from '@/components/socket-provider';
import ChatPanel from '@/components/chat/chat-panel';
import ContactContextPanel from '@/components/chat/contact-context-panel';

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const socket = useSocket();
  const { conversations, setActive, markRead } = useConversationsStore();
  const { setMessages } = useMessagesStore();
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const conversation = conversations.find((c) => c.id === conversationId);

  useEffect(() => {
    if (!conversationId) return;
    setActive(conversationId);

    async function load() {
      setLoading(true);
      try {
        const [msgs, conv] = await Promise.all([
          messagesApi.list(conversationId),
          !conversation ? conversationsApi.get(conversationId) : Promise.resolve(conversation),
        ]);
        setMessages(conversationId, msgs);
        markRead(conversationId);
        conversationsApi.markRead(conversationId);
      } finally {
        setLoading(false);
      }
    }
    load();

    // Join conversation room for typing indicators
    socket?.emit('conversation:join', { conversationId });

    return () => {
      socket?.emit('conversation:leave', { conversationId });
      setActive(null);
    };
  }, [conversationId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <ChatPanel conversationId={conversationId} conversation={conversation} />
      <ContactContextPanel conversation={conversation} />
    </>
  );
}
