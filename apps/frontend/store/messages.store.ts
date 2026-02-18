'use client';
import { create } from 'zustand';

export interface Message {
  id: string;
  conversation_id: string;
  company_id: string;
  sender_type: 'agent' | 'contact' | 'system';
  sender_id: string;
  content_type: string;
  content: string | null;
  attachments: any[];
  status: string;
  read_at: string | null;
  created_at: string;
}

export interface TypingState {
  isTyping: boolean;
  agentId?: string;
  agentName?: string;
}

interface MessagesStore {
  messages: Record<string, Message[]>;
  typing: Record<string, TypingState>;

  setMessages: (conversationId: string, msgs: Message[]) => void;
  appendMessage: (conversationId: string, msg: Message) => void;
  updateMessageStatus: (messageId: string, status: string) => void;
  setTyping: (conversationId: string, state: TypingState) => void;
}

export const useMessagesStore = create<MessagesStore>((set) => ({
  messages: {},
  typing: {},

  setMessages: (conversationId, msgs) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: msgs },
    })),

  appendMessage: (conversationId, msg) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      const alreadyExists = existing.some((m) => m.id === msg.id);
      if (alreadyExists) return state;
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, msg],
        },
      };
    }),

  updateMessageStatus: (messageId, status) =>
    set((state) => {
      const updated = { ...state.messages };
      for (const convId in updated) {
        updated[convId] = updated[convId].map((m) =>
          m.id === messageId ? { ...m, status } : m,
        );
      }
      return { messages: updated };
    }),

  setTyping: (conversationId, typingState) =>
    set((state) => ({
      typing: { ...state.typing, [conversationId]: typingState },
    })),
}));
