'use client';
import { useRouter, useParams } from 'next/navigation';
import { useConversationsStore, Conversation } from '@/store/conversations.store';
import { useAuthStore } from '@/store/auth.store';
import { cn, timeAgo, truncate, getInitials } from '@/lib/utils';
import { Search, MessageSquare } from 'lucide-react';
import { useState, useMemo } from 'react';

// ─── Tipos ───────────────────────────────────────────────────────────────────
type CategoryTab = 'all' | 'mine' | 'unassigned';
type StatusFilter = 'open' | 'resolved' | 'all';

// ─── ChannelBadge ─────────────────────────────────────────────────────────────
function ChannelBadge({ channel }: { channel: string }) {
  const styles: Record<string, { bg: string; label: string; dot: string }> = {
    web_widget:     { bg: 'bg-blue-100 text-blue-600',   label: 'Widget',    dot: 'bg-blue-400' },
    whatsapp_meta:  { bg: 'bg-green-100 text-green-600', label: 'WhatsApp',  dot: 'bg-green-400' },
    telegram:       { bg: 'bg-sky-100 text-sky-600',     label: 'Telegram',  dot: 'bg-sky-400' },
    email:          { bg: 'bg-yellow-100 text-yellow-700', label: 'Email',   dot: 'bg-yellow-400' },
    api:            { bg: 'bg-gray-100 text-gray-600',   label: 'API',       dot: 'bg-gray-400' },
  };
  const s = styles[channel] || styles.api;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold', s.bg)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

// ─── ConversationItem ──────────────────────────────────────────────────────────
function ConversationItem({ conv, active }: { conv: Conversation; active: boolean }) {
  const router = useRouter();
  const name = conv.contact?.full_name || conv.metadata?.contactName || 'Visitante';

  return (
    <button
      onClick={() => router.push(`/inbox/${conv.id}`)}
      className={cn(
        'w-full px-3 py-2.5 flex gap-2.5 items-start hover:bg-gray-50 transition text-left border-b border-gray-50 last:border-0 group',
        active && 'bg-indigo-50 border-r-2 border-r-indigo-500',
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold',
          active ? 'bg-indigo-500' : 'bg-gradient-to-br from-slate-400 to-slate-600',
        )}>
          {getInitials(name)}
        </div>
        {!conv.is_read && conv.status === 'open' && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
        )}
        {conv.status === 'resolved' && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className={cn(
            'text-[13px] truncate',
            !conv.is_read && conv.status === 'open' ? 'font-bold text-gray-900' : 'font-medium text-gray-700',
          )}>
            {name}
          </span>
          <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(conv.last_message_at)}</span>
        </div>

        <p className={cn(
          'text-[11px] truncate mb-1',
          !conv.is_read && conv.status === 'open' ? 'text-gray-700 font-medium' : 'text-gray-400',
        )}>
          {truncate(conv.last_message_preview || 'Conversa iniciada', 38)}
        </p>

        <div className="flex items-center justify-between">
          <ChannelBadge channel={conv.channel} />
          <div className="flex items-center gap-1">
            {conv.unread_count > 0 && (
              <span className="min-w-[16px] h-4 px-1 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {conv.unread_count > 9 ? '9+' : conv.unread_count}
              </span>
            )}
            {conv.assigned_to && conv.agent && (
              <div
                className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] text-white font-black shrink-0"
                title={`Responsavel: ${conv.agent.full_name}`}
              >
                {getInitials(conv.agent.full_name)}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-10 px-4">
      <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
        <MessageSquare className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-xs text-gray-400">{message}</p>
    </div>
  );
}

// ─── ConversationListPanel ────────────────────────────────────────────────────
export default function ConversationListPanel() {
  const params = useParams<{ conversationId?: string }>();
  const { user } = useAuthStore();
  const { conversations, isLoading } = useConversationsStore();

  const [search, setSearch] = useState('');
  const [categoryTab, setCategoryTab] = useState<CategoryTab>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');

  // ── 1. Filtrar por texto de busca ─────────────────────────────────────────
  const afterSearch = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.contact?.full_name?.toLowerCase().includes(q) ||
        c.contact?.email?.toLowerCase().includes(q) ||
        c.last_message_preview?.toLowerCase().includes(q) ||
        c.metadata?.contactName?.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  // ── 2. Filtrar por aba de categoria ──────────────────────────────────────
  const afterCategory = useMemo(() => {
    switch (categoryTab) {
      case 'mine':
        return afterSearch.filter((c) => c.assigned_to === user?.id);
      case 'unassigned':
        return afterSearch.filter((c) => c.assigned_to === null);
      default:
        return afterSearch;
    }
  }, [afterSearch, categoryTab, user?.id]);

  // ── 3. Filtrar por status ─────────────────────────────────────────────────
  const displayed = useMemo(() => {
    switch (statusFilter) {
      case 'open':
        return afterCategory.filter((c) => c.status === 'open');
      case 'resolved':
        return afterCategory.filter((c) => c.status === 'resolved');
      default:
        return afterCategory;
    }
  }, [afterCategory, statusFilter]);

  // Contagens para badges nas tabs de categoria
  const mineCounts = useMemo(() => {
    const base = afterSearch.filter((c) => c.assigned_to === user?.id);
    return {
      open: base.filter((c) => c.status === 'open').length,
      resolved: base.filter((c) => c.status === 'resolved').length,
      all: base.length,
    };
  }, [afterSearch, user?.id]);

  const unassignedCounts = useMemo(() => {
    const base = afterSearch.filter((c) => c.assigned_to === null);
    return {
      open: base.filter((c) => c.status === 'open').length,
      resolved: base.filter((c) => c.status === 'resolved').length,
      all: base.length,
    };
  }, [afterSearch]);

  const allCounts = useMemo(() => ({
    open: afterSearch.filter((c) => c.status === 'open').length,
    resolved: afterSearch.filter((c) => c.status === 'resolved').length,
    all: afterSearch.length,
  }), [afterSearch]);

  function getCategoryCount(tab: CategoryTab): number {
    const counts = tab === 'mine' ? mineCounts : tab === 'unassigned' ? unassignedCounts : allCounts;
    return statusFilter === 'open' ? counts.open : statusFilter === 'resolved' ? counts.resolved : counts.all;
  }

  const unreadCount = conversations.filter((c) => !c.is_read && c.status === 'open').length;

  const categoryTabs: { key: CategoryTab; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'mine', label: 'Meus' },
    { key: 'unassigned', label: 'Nao atribuidos' },
  ];

  const statusOptions: { key: StatusFilter; label: string }[] = [
    { key: 'open', label: 'Abertos' },
    { key: 'resolved', label: 'Concluidos' },
    { key: 'all', label: 'Todos' },
  ];

  return (
    <div className="w-[300px] border-r border-gray-100 bg-white flex flex-col h-full shrink-0 shadow-sm">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 space-y-3">
        {/* Titulo + badge de nao lidas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <h1 className="text-sm font-bold text-gray-900">Inbox</h1>
          </div>
          {unreadCount > 0 && (
            <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
              {unreadCount} novo{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou mensagem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition placeholder-gray-400"
          />
        </div>

        {/* Tabs de categoria */}
        <div className="flex gap-0.5 bg-gray-100 rounded-xl p-0.5">
          {categoryTabs.map(({ key, label }) => {
            const count = getCategoryCount(key);
            return (
              <button
                key={key}
                onClick={() => setCategoryTab(key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition',
                  categoryTab === key
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {label}
                {count > 0 && (
                  <span className={cn(
                    'min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center',
                    categoryTab === key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600',
                  )}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filtro de status */}
        <div className="flex gap-1">
          {statusOptions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                'flex-1 py-1 rounded-lg text-[11px] font-medium transition border',
                statusFilter === key
                  ? key === 'open'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : key === 'resolved'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lista de conversas ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState
            message={
              search
                ? 'Nenhuma conversa encontrada'
                : categoryTab === 'mine'
                ? statusFilter === 'open'
                  ? 'Voce nao tem conversas abertas atribuidas'
                  : 'Nenhuma conversa neste filtro'
                : categoryTab === 'unassigned'
                ? 'Nenhuma conversa nao atribuida'
                : 'Nenhuma conversa neste filtro'
            }
          />
        ) : (
          <>
            <div className="px-3 py-2 sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-50">
              <p className="text-[10px] text-gray-400 font-medium">
                {displayed.length} conversa{displayed.length !== 1 ? 's' : ''}
              </p>
            </div>
            {displayed.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                active={params.conversationId === conv.id}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
