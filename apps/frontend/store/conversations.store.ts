'use client';
import { create } from 'zustand';

export interface Conversation {
  id: string;
  company_id: string;
  contact_id: string;
  assigned_to: string | null;
  session_id: string | null;
  status: string;
  channel: string;
  is_read: boolean;
  unread_count: number;
  last_message_at: string;
  last_message_preview: string | null;
  metadata: Record<string, any>;
  tags: string[];
  created_at: string;
  contact?: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    metadata: Record<string, any>;
  };
  session?: {
    id: string;
    ip_address: string | null;
    last_url: string | null;
    metadata: Record<string, any>;
    balance?: number;
  };
  agent?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export type ConversationFilter = 'all' | 'unread' | 'unassigned' | 'mine' | 'resolved';

interface ConversationsStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  filter: ConversationFilter;
  isLoading: boolean;

  setConversations: (convs: Conversation[]) => void;
  prependConversation: (conv: Conversation) => void;
  upsertConversation: (conv: Conversation) => void;
  setActive: (id: string | null) => void;
  setFilter: (f: ConversationFilter) => void;
  setLoading: (v: boolean) => void;
  markRead: (id: string) => void;
}

export const useConversationsStore = create<ConversationsStore>((set) => ({
  conversations: [],
  activeConversationId: null,
  filter: 'all',
  isLoading: false,

  setConversations: (convs) => set({ conversations: convs }),

  prependConversation: (conv) =>
    set((state) => {
      const exists = state.conversations.find((c) => c.id === conv.id);
      if (exists) return state;
      return { conversations: [conv, ...state.conversations] };
    }),

  upsertConversation: (conv) =>
    set((state) => {
      const idx = state.conversations.findIndex((c) => c.id === conv.id);
      if (idx === -1) {
        return { conversations: [conv, ...state.conversations] };
      }
      const updated = [...state.conversations];
      updated[idx] = conv;
      // Re-sort by last_message_at desc
      updated.sort(
        (a, b) =>
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
      );
      return { conversations: updated };
    }),

  setActive: (id) => set({ activeConversationId: id }),
  setFilter: (filter) => set({ filter }),
  setLoading: (isLoading) => set({ isLoading }),

  markRead: (id) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, is_read: true, unread_count: 0 } : c,
      ),
    })),
}));
