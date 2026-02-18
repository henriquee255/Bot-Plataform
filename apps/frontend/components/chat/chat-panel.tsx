'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useMessagesStore, Message } from '@/store/messages.store';
import { useConversationsStore, Conversation } from '@/store/conversations.store';
import { useAuthStore } from '@/store/auth.store';
import { useSocket } from '@/components/socket-provider';
import { messagesApi, conversationsApi, quickRepliesApi, usersApi, crmApi } from '@/lib/api';
import { cn, formatTime, getInitials } from '@/lib/utils';
import {
  Send, Check, CheckCheck, Clock, Smile, Paperclip, Mic, Zap, RefreshCw,
  MoreVertical, UserCheck, Briefcase, CheckCircle, RotateCcw, ChevronDown,
  Loader2,
} from 'lucide-react';

// ─── Tipos ─────────────────────────────────────────────────────────────────────
interface Agent {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

// ─── MessageBubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  const statusIcon = () => {
    if (!isOwn) return null;
    switch (msg.status) {
      case 'sending':   return <Clock className="w-3 h-3 opacity-60" />;
      case 'sent':      return <Check className="w-3 h-3 opacity-60" />;
      case 'delivered': return <CheckCheck className="w-3 h-3 opacity-60" />;
      case 'read':      return <CheckCheck className="w-3 h-3 text-blue-300" />;
      default:          return null;
    }
  };

  if (msg.sender_type === 'system') {
    return (
      <div className="msg-system text-xs text-gray-400 my-2">
        {msg.content}
      </div>
    );
  }

  return (
    <div className={cn('flex mb-2', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={isOwn ? 'msg-agent' : 'msg-contact'}>
        <p className="text-sm leading-relaxed">{msg.content}</p>
        <div className={cn('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
          <span className={cn('text-[11px]', isOwn ? 'text-indigo-200' : 'text-gray-400')}>
            {formatTime(msg.created_at)}
          </span>
          {statusIcon()}
        </div>
      </div>
    </div>
  );
}

// ─── TypingIndicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex justify-start mb-2">
      <div className="msg-contact px-4 py-3">
        <div className="flex gap-1 items-center">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ─── AssignAgentDropdown ───────────────────────────────────────────────────────
function AssignAgentDropdown({
  conversationId,
  currentAgentId,
  onClose,
  onAssigned,
}: {
  conversationId: string;
  currentAgentId: string | null;
  onClose: () => void;
  onAssigned: (conv: Conversation) => void;
}) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    usersApi.team()
      .then(setAgents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  async function assign(agentId: string) {
    setAssigning(agentId);
    try {
      const updated = await conversationsApi.assign(conversationId, agentId);
      onAssigned(updated);
      onClose();
    } catch {
      // silencioso
    } finally {
      setAssigning(null);
    }
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-gray-100">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Atribuir a agente</p>
      </div>
      <div className="max-h-52 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          </div>
        ) : agents.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Nenhum agente disponivel</p>
        ) : (
          agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => assign(agent.id)}
              disabled={assigning === agent.id}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition text-left',
                currentAgentId === agent.id && 'bg-indigo-50',
              )}
            >
              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {getInitials(agent.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{agent.full_name}</p>
                <p className="text-[10px] text-gray-400 truncate">{agent.email}</p>
              </div>
              {assigning === agent.id && <Loader2 className="w-3 h-3 animate-spin text-indigo-500 shrink-0" />}
              {currentAgentId === agent.id && !assigning && (
                <CheckCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── ActionsMenu ───────────────────────────────────────────────────────────────
function ActionsMenu({
  conversation,
  onClose,
  onConversationUpdated,
}: {
  conversation: Conversation;
  onClose: () => void;
  onConversationUpdated: (conv: Conversation) => void;
}) {
  const [showAssign, setShowAssign] = useState(false);
  const [crmLoading, setCrmLoading] = useState(false);
  const [crmDone, setCrmDone] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora (nao fecha se o dropdown de agentes esta aberto)
  useEffect(() => {
    if (showAssign) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, showAssign]);

  async function sendToCrm() {
    setCrmLoading(true);
    try {
      const contact = conversation.contact;
      await crmApi.addLead({
        name: contact?.full_name || conversation.metadata?.contactName || 'Visitante',
        email: contact?.email || undefined,
        phone: contact?.phone || undefined,
        contact_id: contact?.id || undefined,
        conversation_id: conversation.id,
        source: conversation.channel,
      });
      setCrmDone(true);
      setTimeout(() => {
        setCrmDone(false);
        onClose();
      }, 1500);
    } catch {
      // silencioso
    } finally {
      setCrmLoading(false);
    }
  }

  async function handleResolve() {
    setStatusLoading(true);
    try {
      const updated = await conversationsApi.resolve(conversation.id);
      onConversationUpdated(updated);
      onClose();
    } catch {
      // silencioso
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleReopen() {
    setStatusLoading(true);
    try {
      const updated = await conversationsApi.reopen(conversation.id);
      onConversationUpdated(updated);
      onClose();
    } catch {
      // silencioso
    } finally {
      setStatusLoading(false);
    }
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-visible"
    >
      <div className="py-1">
        {/* Atribuir a agente */}
        <div className="relative">
          <button
            onClick={() => setShowAssign((v) => !v)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition text-left"
          >
            <UserCheck className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-sm text-gray-700 flex-1">Atribuir a agente</span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition', showAssign && 'rotate-180')} />
          </button>
          {showAssign && (
            <div className="absolute left-full top-0 ml-1 z-50">
              <AssignAgentDropdown
                conversationId={conversation.id}
                currentAgentId={conversation.assigned_to}
                onClose={() => { setShowAssign(false); onClose(); }}
                onAssigned={onConversationUpdated}
              />
            </div>
          )}
        </div>

        {/* Enviar ao CRM */}
        <button
          onClick={sendToCrm}
          disabled={crmLoading || crmDone}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition text-left disabled:opacity-60"
        >
          {crmLoading ? (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
          ) : crmDone ? (
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
          ) : (
            <Briefcase className="w-4 h-4 text-blue-500 shrink-0" />
          )}
          <span className="text-sm text-gray-700">
            {crmDone ? 'Enviado!' : 'Enviar ao CRM'}
          </span>
        </button>

        <div className="border-t border-gray-100 my-1" />

        {/* Resolver / Reabrir */}
        {conversation.status === 'open' ? (
          <button
            onClick={handleResolve}
            disabled={statusLoading}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-green-50 transition text-left disabled:opacity-60"
          >
            {statusLoading ? (
              <Loader2 className="w-4 h-4 text-green-500 animate-spin shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
            )}
            <span className="text-sm text-green-700 font-medium">Resolver conversa</span>
          </button>
        ) : (
          <button
            onClick={handleReopen}
            disabled={statusLoading}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-indigo-50 transition text-left disabled:opacity-60"
          >
            {statusLoading ? (
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
            ) : (
              <RotateCcw className="w-4 h-4 text-indigo-500 shrink-0" />
            )}
            <span className="text-sm text-indigo-700 font-medium">Reabrir conversa</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  conversationId: string;
  conversation: Conversation | undefined;
}

// ─── ChatPanel ─────────────────────────────────────────────────────────────────
export default function ChatPanel({ conversationId, conversation }: Props) {
  const { user } = useAuthStore();
  const socket = useSocket();
  const { messages, typing, appendMessage } = useMessagesStore();
  const { upsertConversation } = useConversationsStore();
  const convMessages = messages[conversationId] || [];
  const typingState = typing[conversationId];

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [quickReplies, setQuickReplies] = useState<Array<{ id: string; shortcut: string; title: string; content: string }>>([]);
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false);
  const [quickRepliesSearch, setQuickRepliesSearch] = useState('');
  const [actionsOpen, setActionsOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convMessages.length]);

  useEffect(() => {
    if (quickRepliesOpen) {
      quickRepliesApi.list(quickRepliesSearch || undefined).then(setQuickReplies).catch(() => {});
    }
  }, [quickRepliesOpen, quickRepliesSearch]);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket?.emit('typing:start', { conversationId });
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTypingRef.current = false;
      socket?.emit('typing:stop', { conversationId });
    }, 2000);
  }, [socket, conversationId]);

  async function sendMessage() {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);

    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      conversation_id: conversationId,
      company_id: user?.companyId || '',
      sender_type: 'agent',
      sender_id: user?.id || '',
      content_type: 'text',
      content,
      attachments: [],
      status: 'sending',
      read_at: null,
      created_at: new Date().toISOString(),
    };
    appendMessage(conversationId, optimistic);

    try {
      await messagesApi.send(conversationId, content);
    } catch {
      // silencioso
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Atalho de teclado para resolver (legado mantido para compatibilidade)
  async function resolveConversation() {
    try {
      const updated = await conversationsApi.resolve(conversationId);
      upsertConversation(updated);
    } catch (e) {
      console.error('Failed to resolve:', e);
    }
  }

  async function reopenConversation() {
    try {
      const updated = await conversationsApi.reopen(conversationId);
      upsertConversation(updated);
    } catch (e) {
      console.error('Failed to reopen:', e);
    }
  }

  const channelLabel: Record<string, string> = {
    web_widget:    'Widget Web',
    whatsapp_meta: 'WhatsApp',
    telegram:      'Telegram',
    email:         'Email',
  };

  const channelColor: Record<string, string> = {
    web_widget:    'text-blue-500',
    whatsapp_meta: 'text-green-500',
    telegram:      'text-sky-500',
    email:         'text-yellow-600',
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f7f8fa] min-w-0">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {(conversation?.contact?.full_name || conversation?.metadata?.contactName || 'V').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-sm leading-tight">
              {conversation?.contact?.full_name || conversation?.metadata?.contactName || 'Visitante'}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn('text-[11px] font-semibold', channelColor[conversation?.channel || ''] || 'text-gray-400')}>
                {channelLabel[conversation?.channel || ''] || conversation?.channel || 'Desconhecido'}
              </span>
              {conversation?.agent && (
                <>
                  <span className="text-gray-200 text-[10px]">•</span>
                  <span className="text-[11px] text-gray-400">
                    {conversation.agent.full_name}
                  </span>
                </>
              )}
              {conversation?.session?.ip_address && (
                <>
                  <span className="text-gray-200 text-[10px]">•</span>
                  <span className="text-[11px] text-gray-400 font-mono">{conversation.session.ip_address}</span>
                </>
              )}
              {conversation?.session?.last_url && (
                <>
                  <span className="text-gray-200 text-[10px]">•</span>
                  <span className="text-[11px] text-gray-400 truncate max-w-[160px]">
                    {conversation.session.last_url.replace(/^https?:\/\//, '')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Acoes do header */}
        <div className="flex items-center gap-2">
          {/* Status badge (legado) */}
          {conversation?.status === 'open' && (
            <button
              onClick={resolveConversation}
              className="px-3 py-1.5 text-[12px] font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 transition shadow-sm"
            >
              Finalizar
            </button>
          )}
          {conversation?.status === 'resolved' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-1 rounded-lg border border-gray-200 font-medium">
                Resolvida
              </span>
              <button
                onClick={reopenConversation}
                className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition border border-indigo-100"
              >
                <RefreshCw className="w-3 h-3" />
                Reabrir
              </button>
            </div>
          )}

          {/* Menu de 3 pontos */}
          {conversation && (
            <div className="relative">
              <button
                onClick={() => setActionsOpen((v) => !v)}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-xl transition border',
                  actionsOpen
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    : 'bg-white text-gray-400 border-gray-200 hover:text-gray-700 hover:border-gray-300',
                )}
                title="Mais acoes"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {actionsOpen && (
                <ActionsMenu
                  conversation={conversation}
                  onClose={() => setActionsOpen(false)}
                  onConversationUpdated={(conv) => {
                    upsertConversation(conv);
                    setActionsOpen(false);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mensagens ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0.5">
        {convMessages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-12">
            Nenhuma mensagem ainda
          </div>
        )}
        {convMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isOwn={msg.sender_type === 'agent'}
          />
        ))}
        {typingState?.isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Replies Popup ───────────────────────────────────────────────── */}
      {quickRepliesOpen && (
        <div className="bg-white border-t border-gray-200 px-3 pt-3 shrink-0">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                autoFocus
                className="w-full px-3 py-1.5 text-sm bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="Buscar respostas rapidas..."
                value={quickRepliesSearch}
                onChange={e => setQuickRepliesSearch(e.target.value)}
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {quickReplies.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-400">Nenhuma resposta encontrada</div>
              ) : (
                quickReplies.map(qr => (
                  <button
                    key={qr.id}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition flex items-center gap-3"
                    onClick={() => {
                      setText(qr.content);
                      setQuickRepliesOpen(false);
                      setQuickRepliesSearch('');
                    }}
                  >
                    <span className="text-xs font-mono font-bold text-orange-500 shrink-0">/{qr.shortcut}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{qr.title}</p>
                      <p className="text-xs text-gray-400 truncate">{qr.content}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Composer ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-gray-200 p-3 shrink-0">
        <div className="flex items-end gap-2 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition">
          <div className="flex items-center gap-2 mb-1 shrink-0">
            <button className="text-gray-400 hover:text-indigo-600 transition" title="Anexar arquivo">
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              className={cn('transition', quickRepliesOpen ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500')}
              title="Respostas prontas"
              onClick={() => { setQuickRepliesOpen(!quickRepliesOpen); setQuickRepliesSearch(''); }}
            >
              <Zap className="w-5 h-5" />
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder="Escreva uma mensagem..."
            rows={1}
            spellCheck={true}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-32 py-1 leading-relaxed"
            style={{ minHeight: '24px' }}
          />

          <div className="flex items-center gap-2 mb-1 shrink-0">
            <button className="text-gray-400 hover:text-indigo-600 transition" title="Emojis">
              <Smile className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-red-600 transition" title="Gravar audio">
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={sendMessage}
              disabled={!text.trim() || sending}
              className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
