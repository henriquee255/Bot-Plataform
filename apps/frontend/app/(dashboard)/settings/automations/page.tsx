'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Plus, Zap, Search, Trash2, Edit3, ChevronRight,
  CheckCircle, XCircle, Clock, MessageSquare, Users, Tag,
  ArrowRight, Activity, AlertCircle, TrendingUp, Loader2,
  Play, Pause, Eye, ChevronDown, ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  conditions: any[];
  actions: any[];
  is_active: boolean;
  run_count: number;
  last_run_at?: string;
  created_at: string;
}

const TRIGGER_LABELS: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  conversation_created:    { label: 'Nova conversa',          icon: MessageSquare, color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  first_message_received:  { label: 'Primeira mensagem',      icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  message_received:        { label: 'Mensagem recebida',      icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  conversation_assigned:   { label: 'Conversa atribuída',     icon: Users,         color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  conversation_resolved:   { label: 'Conversa resolvida',     icon: CheckCircle,   color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-200' },
  conversation_waiting:    { label: 'Aguardando resposta',    icon: Clock,         color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  outside_business_hours:  { label: 'Fora do horário',        icon: Clock,         color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  keyword_detected:        { label: 'Palavra-chave detectada',icon: Tag,           color: 'text-pink-600',   bg: 'bg-pink-50 border-pink-200' },
  contact_created:         { label: 'Novo contato',           icon: Users,         color: 'text-cyan-600',   bg: 'bg-cyan-50 border-cyan-200' },
  inactivity:              { label: 'Inatividade',            icon: AlertCircle,   color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
  csat_submitted:          { label: 'Avaliação recebida',     icon: TrendingUp,    color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
};

const ACTION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  send_message:         { label: 'Enviar mensagem',    color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200' },
  assign_agent:         { label: 'Atribuir agente',    color: 'text-green-600',   bg: 'bg-green-50 border-green-200' },
  assign_sector:        { label: 'Atribuir setor',     color: 'text-teal-600',    bg: 'bg-teal-50 border-teal-200' },
  add_tag:              { label: 'Adicionar tag',      color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-200' },
  remove_tag:           { label: 'Remover tag',        color: 'text-pink-600',    bg: 'bg-pink-50 border-pink-200' },
  resolve_conversation: { label: 'Resolver conversa', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  set_priority:         { label: 'Definir prioridade', color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200' },
  move_crm_stage:       { label: 'Mover no CRM',      color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200' },
  send_webhook:         { label: 'Enviar webhook',     color: 'text-gray-600',    bg: 'bg-gray-50 border-gray-200' },
  add_note:             { label: 'Adicionar nota',     color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
};

const DEFAULT_TEMPLATES = [
  {
    name: 'Boas-vindas automática',
    description: 'Envia mensagem de boas-vindas na primeira interação',
    trigger: 'first_message_received',
    trigger_config: {},
    conditions: [],
    conditions_operator: 'AND',
    actions: [{ type: 'send_message', params: { content: 'Olá! Bem-vindo! Em breve um atendente irá te ajudar. 😊' }, delay_seconds: 2 }],
    is_active: true,
  },
  {
    name: 'Resposta fora do horário',
    description: 'Informa o cliente quando está fora do horário comercial',
    trigger: 'outside_business_hours',
    trigger_config: {},
    conditions: [],
    conditions_operator: 'AND',
    actions: [{ type: 'send_message', params: { content: 'Nosso horário de atendimento é de segunda a sexta, 8h às 18h. Deixe sua mensagem!' } }],
    is_active: true,
  },
  {
    name: 'Aviso de espera longa',
    description: 'Notifica cliente após 15 minutos sem resposta',
    trigger: 'conversation_waiting',
    trigger_config: { wait_minutes: 15 },
    conditions: [],
    conditions_operator: 'AND',
    actions: [{ type: 'send_message', params: { content: 'Pedimos desculpas pela demora! Nossos atendentes estão ocupados, mas logo entraremos em contato.' } }],
    is_active: false,
  },
];

// ─── Visual Flow Preview ───────────────────────────────────────────────────────

function FlowNode({ type, label, sublabel, colorClass, bgClass, isLast = false }: {
  type: 'trigger' | 'action' | 'end';
  label: string;
  sublabel?: string;
  colorClass: string;
  bgClass: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className={cn('w-full border-2 rounded-2xl p-3 text-center relative', bgClass)}>
        <div className={cn('text-[10px] font-black uppercase tracking-widest mb-1 opacity-60', colorClass)}>
          {type === 'trigger' ? 'Gatilho' : type === 'end' ? 'Fim' : 'Ação'}
        </div>
        <div className={cn('text-xs font-bold', colorClass)}>{label}</div>
        {sublabel && <div className="text-[10px] text-gray-400 mt-0.5 truncate">{sublabel}</div>}
      </div>
      {!isLast && (
        <div className="flex flex-col items-center my-1">
          <div className="w-0.5 h-3 bg-gray-300" />
          <ArrowDown className="w-3 h-3 text-gray-300" />
        </div>
      )}
    </div>
  );
}

function FlowPreview({ trigger, actions }: { trigger: string; actions: any[] }) {
  const triggerInfo = TRIGGER_LABELS[trigger];
  return (
    <div className="p-4 space-y-0">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Prévia do Fluxo</p>
      <FlowNode
        type="trigger"
        label={triggerInfo?.label || trigger}
        colorClass={triggerInfo?.color || 'text-gray-600'}
        bgClass={triggerInfo?.bg || 'bg-gray-50 border-gray-200'}
      />
      {actions.map((action, i) => {
        const info = ACTION_LABELS[action.type];
        const sublabel = action.type === 'send_message'
          ? (action.params?.content || '').slice(0, 40)
          : action.type === 'add_tag' || action.type === 'remove_tag'
          ? action.params?.tag
          : action.type === 'set_priority'
          ? action.params?.priority
          : undefined;
        return (
          <FlowNode
            key={i}
            type="action"
            label={info?.label || action.type}
            sublabel={sublabel}
            colorClass={info?.color || 'text-gray-600'}
            bgClass={info?.bg || 'bg-gray-50 border-gray-200'}
            isLast={i === actions.length - 1}
          />
        );
      })}
      {actions.length > 0 && (
        <>
          <div className="flex flex-col items-center my-1">
            <div className="w-0.5 h-3 bg-gray-300" />
            <ArrowDown className="w-3 h-3 text-gray-300" />
          </div>
          <FlowNode
            type="end"
            label="Fim do fluxo"
            colorClass="text-gray-500"
            bgClass="bg-gray-50 border-gray-200"
            isLast
          />
        </>
      )}
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  automation?: Automation | null;
  onClose: () => void;
  onSave: () => void;
}

function AutomationModal({ automation, onClose, onSave }: ModalProps) {
  const [form, setForm] = useState({
    name: automation?.name || '',
    description: automation?.description || '',
    trigger: automation?.trigger || 'first_message_received',
    trigger_config: (automation as any)?.trigger_config || {},
    conditions: automation?.conditions || [],
    conditions_operator: (automation as any)?.conditions_operator || 'AND',
    actions: automation?.actions || [{ type: 'send_message', params: { content: '' } }],
    is_active: automation?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'editor' | 'flow'>('editor');

  const addAction = () => setForm(p => ({ ...p, actions: [...p.actions, { type: 'send_message', params: { content: '' } }] }));
  const updateAction = (i: number, data: any) => setForm(p => { const a = [...p.actions]; a[i] = { ...a[i], ...data }; return { ...p, actions: a }; });
  const removeAction = (i: number) => setForm(p => ({ ...p, actions: p.actions.filter((_, j) => j !== i) }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (automation?.id) {
        await api.patch(`/automations/${automation.id}`, form);
      } else {
        await api.post('/automations', form);
      }
      onSave();
      onClose();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-900">{automation?.id ? 'Editar Automação' : 'Nova Automação'}</h2>
            <p className="text-sm text-gray-400">Configure o gatilho e as ações</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Tab switcher */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 text-sm">
              <button
                onClick={() => setTab('editor')}
                className={cn('px-3 py-1 rounded-lg font-semibold transition', tab === 'editor' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500')}
              >
                Editor
              </button>
              <button
                onClick={() => setTab('flow')}
                className={cn('flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition', tab === 'flow' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500')}
              >
                <Eye className="w-3.5 h-3.5" /> Fluxo
              </button>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Editor */}
          <div className={cn('flex-1 overflow-y-auto p-6 space-y-5', tab === 'flow' ? 'hidden' : '')}>
            {/* Name & Description */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Boas-vindas automática"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Descrição</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="O que essa automação faz?"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Trigger */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">
                <Zap className="w-3.5 h-3.5 inline mr-1" /> Gatilho
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TRIGGER_LABELS).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => setForm(p => ({ ...p, trigger: key }))}
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all',
                      form.trigger === key ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', info.bg)}>
                      <info.icon className={cn('w-3.5 h-3.5', info.color)} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{info.label}</span>
                    {form.trigger === key && <CheckCircle className="w-3.5 h-3.5 text-indigo-500 ml-auto shrink-0" />}
                  </button>
                ))}
              </div>
              {form.trigger === 'conversation_waiting' && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                  <Clock className="w-4 h-4 text-yellow-600 shrink-0" />
                  <span className="text-sm text-yellow-700 font-medium">Aguardar</span>
                  <input
                    type="number"
                    min="1"
                    value={(form.trigger_config as any).wait_minutes || 15}
                    onChange={e => setForm(p => ({ ...p, trigger_config: { wait_minutes: Number(e.target.value) } }))}
                    className="w-16 px-2 py-1 border border-yellow-200 rounded-lg text-sm text-center"
                  />
                  <span className="text-sm text-yellow-700 font-medium">minutos</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <ArrowRight className="w-3.5 h-3.5 inline mr-1" /> Ações
                </label>
                <button onClick={addAction} className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>
              <div className="space-y-3">
                {form.actions.map((action: any, i: number) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-bold text-gray-400 w-5 text-center">{i + 1}</div>
                      <select
                        value={action.type}
                        onChange={e => updateAction(i, { type: e.target.value, params: {} })}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                      >
                        {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      {form.actions.length > 1 && (
                        <button onClick={() => removeAction(i)} className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {action.type === 'send_message' && (
                      <textarea
                        value={action.params?.content || ''}
                        onChange={e => updateAction(i, { params: { content: e.target.value } })}
                        placeholder="Mensagem a ser enviada..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none bg-white"
                      />
                    )}
                    {(action.type === 'add_tag' || action.type === 'remove_tag') && (
                      <input
                        type="text"
                        value={action.params?.tag || ''}
                        onChange={e => updateAction(i, { params: { tag: e.target.value } })}
                        placeholder="Nome da tag"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                      />
                    )}
                    {action.type === 'set_priority' && (
                      <select
                        value={action.params?.priority || 'normal'}
                        onChange={e => updateAction(i, { params: { priority: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                      >
                        <option value="low">Baixa</option>
                        <option value="normal">Normal</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-400">Delay:</span>
                      <input
                        type="number"
                        min="0"
                        value={action.delay_seconds || 0}
                        onChange={e => updateAction(i, { delay_seconds: Number(e.target.value) })}
                        className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs text-center bg-white"
                      />
                      <span className="text-xs text-gray-400">segundos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-gray-700">Ativar imediatamente</p>
                <p className="text-xs text-gray-400 mt-0.5">Começa a funcionar assim que salvar</p>
              </div>
              <button
                onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                className={cn('w-12 h-6 rounded-full transition-colors relative', form.is_active ? 'bg-indigo-600' : 'bg-gray-300')}
              >
                <div className={cn('w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow', form.is_active ? 'left-6' : 'left-0.5')} />
              </button>
            </div>
          </div>

          {/* Right: Flow Preview (always visible in editor) */}
          {tab === 'editor' && (
            <div className="w-56 border-l border-gray-100 overflow-y-auto bg-gray-50/50 shrink-0">
              <FlowPreview trigger={form.trigger} actions={form.actions} />
            </div>
          )}

          {/* Full Flow View Tab */}
          {tab === 'flow' && (
            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
              <p className="text-sm text-gray-400 mb-6 text-center">Visualização do fluxo de automação</p>
              <div className="w-64">
                <FlowPreview trigger={form.trigger} actions={form.actions} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || saving}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Automação'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.get('/automations'),
        api.get('/automations/stats'),
      ]);
      setAutomations(listRes.data);
      setStats(statsRes.data);
    } catch {
      setAutomations([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id: string) => {
    try { await api.post(`/automations/${id}/toggle`); load(); } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta automação?')) return;
    try { await api.delete(`/automations/${id}`); load(); } catch {}
  };

  const seedTemplates = async () => {
    for (const t of DEFAULT_TEMPLATES) {
      try { await api.post('/automations', t); } catch {}
    }
    load();
  };

  const filtered = automations.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()));
  const activeCount = automations.filter(a => a.is_active).length;

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Automações</h1>
            <p className="text-sm text-gray-500 mt-1">{activeCount} ativa{activeCount !== 1 ? 's' : ''} · {automations.length} total</p>
          </div>
          <div className="flex items-center gap-3">
            {automations.length === 0 && (
              <button onClick={seedTemplates} className="flex items-center gap-2 px-4 py-2.5 border border-indigo-200 text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition">
                <Zap className="w-4 h-4" /> Templates padrão
              </button>
            )}
            <button
              onClick={() => { setEditingAutomation(null); setShowModal(true); }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              <Plus className="w-4 h-4" /> Nova Automação
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && automations.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total', value: stats.total, color: 'text-gray-900' },
              { label: 'Ativas', value: stats.active, color: 'text-green-600' },
              { label: 'Execuções', value: stats.total_runs, color: 'text-indigo-600' },
              { label: 'Taxa sucesso', value: `${(stats.success_rate || 0).toFixed(0)}%`, color: 'text-emerald-600' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                <p className={cn('text-2xl font-black', s.color)}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar automações..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-gray-900 font-bold text-lg">Nenhuma automação criada</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">Automatize tarefas repetitivas e economize tempo</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={seedTemplates} className="flex items-center gap-2 border border-indigo-200 text-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition">
                <Zap className="w-4 h-4" /> Usar templates
              </button>
              <button onClick={() => { setEditingAutomation(null); setShowModal(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                <Plus className="w-4 h-4" /> Criar do zero
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(automation => {
              const trigger = TRIGGER_LABELS[automation.trigger];
              const isPreviewOpen = previewId === automation.id;
              return (
                <div key={automation.id} className={cn('bg-white border rounded-2xl shadow-sm transition-all', automation.is_active ? 'border-gray-100 hover:shadow-md' : 'border-gray-100 opacity-60')}>
                  <div className="p-5 flex items-start gap-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2', trigger?.bg || 'bg-gray-50 border-gray-200')}>
                      {trigger?.icon ? <trigger.icon className={cn('w-5 h-5', trigger.color)} /> : <Zap className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-900">{automation.name}</p>
                          {automation.description && <p className="text-sm text-gray-400 mt-0.5">{automation.description}</p>}
                        </div>
                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold shrink-0', automation.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                          {automation.is_active ? 'Ativa' : 'Pausada'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500">{trigger?.label || automation.trigger}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-gray-300" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500">{automation.actions.length} ação{automation.actions.length !== 1 ? 'ões' : ''}</span>
                        </div>
                        {automation.run_count > 0 && (
                          <>
                            <span className="text-gray-200">·</span>
                            <div className="flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs text-gray-500">{automation.run_count}x</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setPreviewId(isPreviewOpen ? null : automation.id)}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50"
                        title="Ver fluxo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggle(automation.id)}
                        className={cn('w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center transition', automation.is_active ? 'text-green-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200' : 'text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200')}
                        title={automation.is_active ? 'Pausar' : 'Ativar'}
                      >
                        {automation.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => { setEditingAutomation(automation); setShowModal(true); }} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(automation.id)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Flow Preview */}
                  {isPreviewOpen && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 rounded-b-2xl">
                      <div className="flex gap-2 items-center flex-wrap">
                        {/* Trigger */}
                        <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold', trigger?.bg || 'bg-gray-50 border-gray-200', trigger?.color || 'text-gray-600')}>
                          {trigger?.icon && <trigger.icon className="w-3.5 h-3.5" />}
                          {trigger?.label || automation.trigger}
                        </div>
                        {automation.actions.map((action: any, i) => {
                          const info = ACTION_LABELS[action.type];
                          return (
                            <div key={i} className="flex items-center gap-2">
                              <ChevronRight className="w-4 h-4 text-gray-300" />
                              <div className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-semibold', info?.bg || 'bg-gray-50 border-gray-200', info?.color || 'text-gray-600')}>
                                {info?.label || action.type}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <AutomationModal
          automation={editingAutomation}
          onClose={() => { setShowModal(false); setEditingAutomation(null); }}
          onSave={load}
        />
      )}
    </div>
  );
}
