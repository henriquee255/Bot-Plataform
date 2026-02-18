'use client';
import { useEffect, useState } from 'react';
import { quickRepliesApi, sectorsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Plus, Edit2, Trash2, Zap, Search, X, Check, Globe, User, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

type Scope = 'global' | 'sector' | 'individual';

interface QuickReply {
  id: string;
  shortcut: string;
  title: string;
  content: string;
  scope: Scope;
  user_id?: string | null;
  sector_id?: string | null;
}

interface Sector {
  id: string;
  name: string;
}

const emptyForm: Omit<QuickReply, 'id'> = {
  shortcut: '',
  title: '',
  content: '',
  scope: 'global',
  user_id: null,
  sector_id: null,
};

const SCOPE_TABS: { value: Scope | 'all'; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'all', label: 'Todas', icon: Layers, color: 'text-gray-600' },
  { value: 'global', label: 'Global', icon: Globe, color: 'text-indigo-600' },
  { value: 'sector', label: 'Por Setor', icon: Layers, color: 'text-emerald-600' },
  { value: 'individual', label: 'Individual', icon: User, color: 'text-orange-600' },
];

const SCOPE_META: Record<Scope, { label: string; badge: string; icon: React.ElementType }> = {
  global: { label: 'Global', badge: 'bg-indigo-100 text-indigo-700', icon: Globe },
  sector: { label: 'Setor', badge: 'bg-emerald-100 text-emerald-700', icon: Layers },
  individual: { label: 'Individual', badge: 'bg-orange-100 text-orange-700', icon: User },
};

export default function QuickRepliesPage() {
  const { user } = useAuthStore();
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<Scope | 'all'>('all');
  const [editing, setEditing] = useState<(Partial<QuickReply> & { isNew?: boolean }) | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const scopeParam = activeTab === 'all' ? undefined : activeTab;
    const [data, sectorData] = await Promise.all([
      quickRepliesApi.list(search || undefined, scopeParam).catch(() => []),
      sectorsApi.list().catch(() => []),
    ]);
    setReplies(data);
    setSectors(sectorData);
    setLoading(false);
  }

  useEffect(() => { load(); }, [search, activeTab]);

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const payload: Partial<QuickReply> = {
        shortcut: editing.shortcut,
        title: editing.title,
        content: editing.content,
        scope: editing.scope || 'global',
        user_id: editing.scope === 'individual' ? (user?.id || null) : null,
        sector_id: editing.scope === 'sector' ? (editing.sector_id || null) : null,
      };

      if (editing.id) {
        const updated = await quickRepliesApi.update(editing.id, payload);
        setReplies(prev => prev.map(r => r.id === updated.id ? updated : r));
      } else {
        const created = await quickRepliesApi.create(payload);
        setReplies(prev => [...prev, created]);
      }
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function deleteReply(id: string) {
    if (!confirm('Excluir esta resposta rápida?')) return;
    await quickRepliesApi.delete(id);
    setReplies(prev => prev.filter(r => r.id !== id));
  }

  function openNew() {
    const defaultScope: Scope = activeTab === 'all' ? 'global' : (activeTab as Scope);
    setEditing({ ...emptyForm, scope: defaultScope, isNew: true });
  }

  function getSectorName(id?: string | null) {
    if (!id) return '';
    return sectors.find(s => s.id === id)?.name || id;
  }

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Respostas Rápidas</h1>
            <p className="text-sm text-gray-500">Use atalhos para enviar mensagens predefinidas no chat</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Nova Resposta
          </button>
        </div>

        {/* How-to banner */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2rem] p-5 mb-6 flex gap-3 items-start">
          <div className="p-2 bg-orange-100 rounded-xl shrink-0">
            <Zap className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-sm">
            <p className="font-bold text-gray-800 mb-1">Como usar</p>
            <p className="text-gray-500">
              No campo de mensagem, digite{' '}
              <code className="bg-white px-1.5 py-0.5 rounded font-mono text-xs">/atalho</code>{' '}
              para buscar respostas rápidas. Clique para inserir automaticamente.
            </p>
          </div>
        </div>

        {/* Scope tabs */}
        <div className="flex gap-1 mb-4 bg-white border border-gray-200 p-1 rounded-2xl w-fit">
          {SCOPE_TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition',
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scope info strip */}
        {activeTab !== 'all' && (
          <div className={cn(
            'text-xs font-medium px-4 py-2 rounded-xl mb-4 flex items-center gap-2',
            activeTab === 'global' && 'bg-indigo-50 text-indigo-700',
            activeTab === 'sector' && 'bg-emerald-50 text-emerald-700',
            activeTab === 'individual' && 'bg-orange-50 text-orange-700',
          )}>
            {activeTab === 'global' && <><Globe className="w-3.5 h-3.5" /> Visivel para toda a empresa</>}
            {activeTab === 'sector' && <><Layers className="w-3.5 h-3.5" /> Visivel apenas para membros do setor selecionado</>}
            {activeTab === 'individual' && <><User className="w-3.5 h-3.5" /> Visivel apenas para voce</>}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
            placeholder="Buscar respostas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Inline edit/create form */}
        {editing && (
          <div className="bg-white rounded-[2rem] border-2 border-indigo-200 shadow-md p-6 mb-4">
            <h3 className="font-bold text-gray-800 mb-4">{editing.id ? 'Editar Resposta' : 'Nova Resposta'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Atalho</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">/</span>
                    <input
                      className="w-full pl-6 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-mono"
                      value={editing.shortcut || ''}
                      onChange={e => setEditing({ ...editing, shortcut: e.target.value.replace(/\s/g, '').toLowerCase() })}
                      placeholder="atalho"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Titulo</label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                    value={editing.title || ''}
                    onChange={e => setEditing({ ...editing, title: e.target.value })}
                    placeholder="Nome da resposta"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Conteudo</label>
                <textarea
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                  value={editing.content || ''}
                  onChange={e => setEditing({ ...editing, content: e.target.value })}
                  rows={3}
                  placeholder="Texto da resposta..."
                />
              </div>

              {/* Scope selector */}
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-2">Visibilidade</label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: 'global', label: 'Global', sub: 'Toda a empresa', icon: Globe, active: 'bg-indigo-600 text-white border-indigo-600', inactive: 'border-gray-200 text-gray-600 hover:border-indigo-300' },
                      { value: 'sector', label: 'Por Setor', sub: 'Membros do setor', icon: Layers, active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'border-gray-200 text-gray-600 hover:border-emerald-300' },
                      { value: 'individual', label: 'Individual', sub: 'So para mim', icon: User, active: 'bg-orange-500 text-white border-orange-500', inactive: 'border-gray-200 text-gray-600 hover:border-orange-300' },
                    ] as const
                  ).map(opt => {
                    const Icon = opt.icon;
                    const isActive = editing.scope === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setEditing({ ...editing, scope: opt.value, sector_id: opt.value !== 'sector' ? null : editing.sector_id })}
                        className={cn(
                          'flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition',
                          isActive ? opt.active : opt.inactive,
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-bold">{opt.label}</span>
                        <span className={cn('text-[10px]', isActive ? 'text-white/80' : 'text-gray-400')}>{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sector dropdown (only when scope=sector) */}
              {editing.scope === 'sector' && (
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Setor</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm bg-white"
                    value={editing.sector_id || ''}
                    onChange={e => setEditing({ ...editing, sector_id: e.target.value || null })}
                  >
                    <option value="">Selecione um setor...</option>
                    {sectors.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={saving || !editing.shortcut || !editing.title || !editing.content}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : replies.length === 0 && !editing ? (
          <div className="text-center py-16">
            <Zap className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Nenhuma resposta rapida</p>
            <button
              onClick={openNew}
              className="mt-3 text-indigo-600 text-sm font-bold hover:underline"
            >
              Criar primeira resposta
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {replies.map(reply => {
              const scopeMeta = SCOPE_META[reply.scope] || SCOPE_META.global;
              const ScopeIcon = scopeMeta.icon;
              return (
                <div
                  key={reply.id}
                  className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-4 flex items-start gap-4 group hover:shadow-md transition-shadow"
                >
                  <div className="px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-xl font-mono text-sm font-bold text-orange-600 shrink-0">
                    /{reply.shortcut}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-gray-800 text-sm">{reply.title}</p>
                      {/* Scope badge */}
                      <span className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold', scopeMeta.badge)}>
                        <ScopeIcon className="w-2.5 h-2.5" />
                        {scopeMeta.label}
                        {reply.scope === 'sector' && reply.sector_id && (
                          <span className="opacity-75"> - {getSectorName(reply.sector_id)}</span>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{reply.content}</p>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => setEditing(reply)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteReply(reply.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
