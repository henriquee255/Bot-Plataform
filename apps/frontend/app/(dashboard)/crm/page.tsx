'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Plus, Search, Users, DollarSign, CheckCircle, XCircle,
  TrendingUp, MoreHorizontal, RefreshCw, SlidersHorizontal,
  BarChart2, Phone, Edit3, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  win_probability?: number;
}

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

interface Contact {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  tags: string[];
  source?: string;
  crm_stage_id?: string;
  crm_pipeline_id?: string;
  lead_value: number;
  is_lead: boolean;
  created_at: string;
}

const SOURCE_COLORS: Record<string, string> = {
  website: 'bg-blue-100 text-blue-700',
  social_media: 'bg-pink-100 text-pink-700',
  referral: 'bg-green-100 text-green-700',
  search: 'bg-yellow-100 text-yellow-700',
  direct: 'bg-gray-100 text-gray-700',
  whatsapp: 'bg-emerald-100 text-emerald-700',
  email_campaign: 'bg-indigo-100 text-indigo-700',
  paid_ads: 'bg-orange-100 text-orange-700',
};

const SOURCE_LABELS: Record<string, string> = {
  website: 'Website',
  social_media: 'Redes Sociais',
  referral: 'Indicação',
  search: 'Busca',
  direct: 'Direto',
  whatsapp: 'WhatsApp',
  email_campaign: 'E-mail',
  paid_ads: 'Anúncios',
  other: 'Outro',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function ContactCard({
  contact, stages, onMove, onEdit, onDragStart,
}: {
  contact: Contact;
  stages: Stage[];
  onMove: (contactId: string, stageId: string) => void;
  onEdit: (contact: Contact) => void;
  onDragStart: (contactId: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const initials = contact.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '??';

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setIsDragging(true); onDragStart(contact.id); }}
      onDragEnd={() => setIsDragging(false)}
      className={cn('bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all group relative cursor-grab active:cursor-grabbing', isDragging && 'opacity-40 scale-95')}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-none">{contact.full_name || 'Sem nome'}</p>
            {contact.email && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[140px]">{contact.email}</p>}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-xl z-30 py-1 w-44">
              <button onClick={() => { onEdit(contact); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5" /> Editar
              </button>
              <div className="border-t border-gray-100 my-1" />
              <p className="px-3 py-1 text-[10px] text-gray-400 font-semibold uppercase">Mover para</p>
              {stages.map(s => (
                <button
                  key={s.id}
                  onClick={() => { onMove(contact.id, s.id); setShowMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {contact.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {contact.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-medium">{tag}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        {contact.source && (
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', SOURCE_COLORS[contact.source] || 'bg-gray-100 text-gray-600')}>
            {SOURCE_LABELS[contact.source] || contact.source}
          </span>
        )}
        {Number(contact.lead_value) > 0 && (
          <span className="text-xs font-bold text-emerald-600 ml-auto">{formatCurrency(Number(contact.lead_value))}</span>
        )}
      </div>

      {contact.phone && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-50">
          <Phone className="w-3 h-3 text-gray-300" />
          <span className="text-[10px] text-gray-400">{contact.phone}</span>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ stage, contacts, allStages, onMove, onEdit, onDragStart, onDrop }: {
  stage: Stage;
  contacts: Contact[];
  allStages: Stage[];
  onMove: (contactId: string, stageId: string) => void;
  onEdit: (contact: Contact) => void;
  onDragStart: (contactId: string) => void;
  onDrop: (stageId: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const totalValue = contacts.reduce((sum, c) => sum + Number(c.lead_value || 0), 0);
  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
          <span className="text-sm font-bold text-gray-800">{stage.name}</span>
          <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">{contacts.length}</span>
        </div>
        {totalValue > 0 && <span className="text-xs font-semibold text-emerald-600">{formatCurrency(totalValue)}</span>}
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onDrop(stage.id); }}
        className={cn('space-y-3 min-h-[200px] rounded-2xl p-2 transition-all border-2', isDragOver ? 'border-dashed border-indigo-400 bg-indigo-50/50 scale-[1.01]' : 'border-transparent')}
        style={{ backgroundColor: isDragOver ? undefined : `${stage.color}10` }}
      >
        {contacts.map(contact => (
          <ContactCard key={contact.id} contact={contact} stages={allStages} onMove={onMove} onEdit={onEdit} onDragStart={onDragStart} />
        ))}
        {contacts.length === 0 && (
          <div className="h-24 flex items-center justify-center">
            <p className="text-xs text-gray-300 font-medium">{isDragOver ? 'Soltar aqui' : 'Nenhum lead'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CrmPage() {
  const [stats, setStats] = useState<any>(null);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [board, setBoard] = useState<Record<string, Contact[]>>({});
  const [loading, setLoading] = useState(true);
  const [draggedContactId, setDraggedContactId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', phone: '', source: '', lead_value: 0, tags: '', notes: '', stage_id: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [filterSource, setFilterSource] = useState('');
  const [filterMinValue, setFilterMinValue] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, boardRes] = await Promise.all([
        api.get('/crm/stats'),
        api.get('/crm/board'),
      ]);
      setStats(statsRes.data);
      setPipeline(statsRes.data.pipeline);
      setBoard(boardRes.data);
    } catch {
      // Fallback: use mock pipeline
      const mockPipeline: Pipeline = {
        id: 'default',
        name: 'Pipeline de Vendas',
        stages: [
          { id: '1', name: 'Lead', color: '#6366f1', order: 0 },
          { id: '2', name: 'Qualificado', color: '#8b5cf6', order: 1 },
          { id: '3', name: 'Proposta', color: '#f59e0b', order: 2 },
          { id: '4', name: 'Negociação', color: '#f97316', order: 3 },
          { id: '5', name: 'Ganho', color: '#10b981', order: 4 },
          { id: '6', name: 'Perdido', color: '#ef4444', order: 5 },
        ],
      };
      setPipeline(mockPipeline);
      setBoard({ '1': [], '2': [], '3': [], '4': [], '5': [], '6': [] });
      setStats({ totalLeads: 0, totalValue: 0, wonDeals: 0, lostDeals: 0, conversionRate: 0, byStage: {}, pipeline: mockPipeline });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleMove = async (contactId: string, stageId: string) => {
    if (!pipeline) return;
    // Optimistic update
    setBoard(prev => {
      const next: Record<string, Contact[]> = {};
      let moved: Contact | undefined;
      for (const [sid, contacts] of Object.entries(prev)) {
        const filtered = contacts.filter(c => { if (c.id === contactId) { moved = c; return false; } return true; });
        next[sid] = filtered;
      }
      if (moved) next[stageId] = [{ ...moved, crm_stage_id: stageId }, ...(next[stageId] || [])];
      return next;
    });
    try {
      await api.patch(`/crm/contacts/${contactId}/move`, { stageId, pipelineId: pipeline.id });
      await loadData();
    } catch { await loadData(); }
  };

  const handleDrop = (stageId: string) => {
    if (draggedContactId) {
      handleMove(draggedContactId, stageId);
      setDraggedContactId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContact) return;
    setSaving(true);
    try {
      await api.patch(`/crm/contacts/${editContact.id}`, { ...editForm, is_lead: true });
      setEditContact(null);
      loadData();
    } catch {}
    setSaving(false);
  };

  const handleAddLead = async () => {
    if (!addForm.full_name.trim()) return;
    setAddSaving(true);
    try {
      await api.post('/crm/leads', {
        ...addForm,
        lead_value: Number(addForm.lead_value),
        tags: addForm.tags ? addForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        stage_id: addForm.stage_id || undefined,
        pipeline_id: pipeline?.id,
      });
      setShowAddLead(false);
      setAddForm({ full_name: '', email: '', phone: '', source: '', lead_value: 0, tags: '', notes: '', stage_id: '' });
      loadData();
    } catch {}
    setAddSaving(false);
  };

  const filteredBoard = useCallback((): Record<string, Contact[]> => {
    const result: Record<string, Contact[]> = {};
    for (const [stageId, contacts] of Object.entries(board)) {
      result[stageId] = contacts.filter(c => {
        const matchSearch = !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search);
        const matchSource = !filterSource || c.source === filterSource;
        const matchValue = !filterMinValue || Number(c.lead_value) >= filterMinValue;
        return matchSearch && matchSource && matchValue;
      });
    }
    return result;
  }, [board, search]);

  const totalContacts = Object.values(board).reduce((sum, c) => sum + c.length, 0);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm text-gray-400">Carregando CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-gray-900">CRM</h1>
            <p className="text-sm text-gray-500 mt-0.5">{totalContacts} leads · {pipeline?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAddLead(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              Adicionar Lead
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-5 gap-3 mb-4">
            {[
              { label: 'Total Leads', value: stats.totalLeads, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Valor Total', value: formatCurrency(stats.totalValue || 0), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Ganhos', value: stats.wonDeals, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Perdidos', value: stats.lostDeals, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Conversão', value: `${(stats.conversionRate || 0).toFixed(1)}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', stat.bg)}>
                  <stat.icon className={cn('w-[18px] h-[18px]', stat.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{stat.label}</p>
                  <p className="text-base font-black text-gray-900 leading-none mt-0.5 truncate">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar leads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition"
            />
          </div>
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Todas as origens</option>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input
            type="number"
            min={0}
            step={100}
            placeholder="Valor mín. R$"
            value={filterMinValue || ''}
            onChange={e => setFilterMinValue(Number(e.target.value))}
            className="w-32 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-5 h-full" style={{ minWidth: 'max-content' }}>
          {pipeline?.stages.sort((a, b) => a.order - b.order).map(stage => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              contacts={filteredBoard()[stage.id] || []}
              allStages={pipeline.stages}
              onMove={handleMove}
              onEdit={(c) => { setEditContact(c); setEditForm({ tags: c.tags, source: c.source, lead_value: c.lead_value }); }}
              onDragStart={setDraggedContactId}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editContact && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Editar Lead</h2>
              <button onClick={() => setEditContact(null)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="font-semibold text-gray-900">{editContact.full_name}</p>
                <p className="text-sm text-gray-400">{editContact.email}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Tags (separadas por vírgula)</label>
                <input
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={editForm.tags?.join(', ') || ''}
                  onChange={e => setEditForm((f: any) => ({ ...f, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) }))}
                  placeholder="vendas, premium, urgente..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Origem</label>
                <select
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={editForm.source || ''}
                  onChange={e => setEditForm((f: any) => ({ ...f, source: e.target.value }))}
                >
                  <option value="">Selecionar origem...</option>
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Valor do Lead (R$)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={editForm.lead_value || 0}
                  onChange={e => setEditForm((f: any) => ({ ...f, lead_value: Number(e.target.value) }))}
                  min="0" step="100"
                />
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={() => setEditContact(null)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Adicionar Lead</h2>
              <button onClick={() => setShowAddLead(false)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nome *</label>
                <input autoFocus className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" value={addForm.full_name} onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Nome completo do lead" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">E-mail</label>
                  <input type="email" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Telefone</label>
                  <input type="tel" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Origem</label>
                  <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none" value={addForm.source} onChange={e => setAddForm(f => ({ ...f, source: e.target.value }))}>
                    <option value="">Selecionar...</option>
                    {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Etapa</label>
                  <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none" value={addForm.stage_id} onChange={e => setAddForm(f => ({ ...f, stage_id: e.target.value }))}>
                    <option value="">1ª etapa (padrão)</option>
                    {pipeline?.stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Valor (R$)</label>
                <input type="number" min={0} step={100} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" value={addForm.lead_value || ''} onChange={e => setAddForm(f => ({ ...f, lead_value: Number(e.target.value) }))} placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Tags</label>
                <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" value={addForm.tags} onChange={e => setAddForm(f => ({ ...f, tags: e.target.value }))} placeholder="vendas, premium (separadas por vírgula)" />
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={() => setShowAddLead(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={handleAddLead} disabled={addSaving || !addForm.full_name.trim()} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {addSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
