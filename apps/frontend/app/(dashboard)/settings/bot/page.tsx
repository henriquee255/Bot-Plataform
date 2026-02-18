'use client';
import { useEffect, useState } from 'react';
import { botFlowsApi } from '@/lib/api';
import { Plus, Bot, Trash2, Edit2, ToggleLeft, ToggleRight, Zap, MessageSquare, Tag, UserCheck, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BotStep {
  type: 'message' | 'assign' | 'tag' | 'close';
  value?: string;
  delay?: number;
}

interface BotFlow {
  id: string;
  name: string;
  trigger_type: 'first_message' | 'keyword' | 'new_conversation';
  trigger_value?: string;
  steps: BotStep[];
  enabled: boolean;
}

const TRIGGER_LABELS: Record<string, string> = {
  first_message: 'Primeira mensagem',
  keyword: 'Palavra-chave',
  new_conversation: 'Nova conversa',
};

const STEP_ICONS: Record<string, any> = {
  message: MessageSquare,
  assign: UserCheck,
  tag: Tag,
  close: X,
};

const STEP_LABELS: Record<string, string> = {
  message: 'Enviar mensagem',
  assign: 'Atribuir agente',
  tag: 'Adicionar tag',
  close: 'Fechar conversa',
};

function StepEditor({ steps, onChange }: { steps: BotStep[]; onChange: (steps: BotStep[]) => void }) {
  function addStep() {
    onChange([...steps, { type: 'message', value: '', delay: 0 }]);
  }

  function updateStep(i: number, patch: Partial<BotStep>) {
    const updated = steps.map((s, idx) => idx === i ? { ...s, ...patch } : s);
    onChange(updated);
  }

  function removeStep(i: number) {
    onChange(steps.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const Icon = STEP_ICONS[step.type] || MessageSquare;
        return (
          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="p-1.5 bg-white rounded-lg shadow-sm shrink-0 mt-0.5">
              <Icon className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1 space-y-2">
              <select
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={step.type}
                onChange={e => updateStep(i, { type: e.target.value as BotStep['type'], value: '' })}
              >
                {Object.entries(STEP_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              {(step.type === 'message' || step.type === 'tag') && (
                <input
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder={step.type === 'message' ? 'Texto da mensagem...' : 'Nome da tag...'}
                  value={step.value || ''}
                  onChange={e => updateStep(i, { value: e.target.value })}
                />
              )}
              {step.type === 'assign' && (
                <input
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="ID do agente..."
                  value={step.value || ''}
                  onChange={e => updateStep(i, { value: e.target.value })}
                />
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Aguardar</span>
                <input
                  type="number"
                  min={0}
                  className="w-16 px-2 py-1 rounded-lg border border-gray-200 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={step.delay ?? 0}
                  onChange={e => updateStep(i, { delay: parseInt(e.target.value) || 0 })}
                />
                <span className="text-xs text-gray-400">segundos antes</span>
              </div>
            </div>
            <button onClick={() => removeStep(i)} className="text-gray-400 hover:text-red-500 transition p-1 shrink-0 mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
      <button
        onClick={addStep}
        className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition font-medium flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Adicionar Passo
      </button>
    </div>
  );
}

export default function BotFlowsPage() {
  const [flows, setFlows] = useState<BotFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<BotFlow> | null>(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const data = await botFlowsApi.list().catch(() => []);
    setFlows(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        const updated = await botFlowsApi.update(editing.id, editing);
        setFlows(prev => prev.map(f => f.id === updated.id ? updated : f));
      } else {
        const created = await botFlowsApi.create({ ...editing, enabled: true });
        setFlows(prev => [created, ...prev]);
      }
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(flow: BotFlow) {
    const updated = await botFlowsApi.update(flow.id, { enabled: !flow.enabled });
    setFlows(prev => prev.map(f => f.id === updated.id ? updated : f));
  }

  async function deleteFlow(id: string) {
    if (!confirm('Excluir este fluxo?')) return;
    await botFlowsApi.delete(id);
    setFlows(prev => prev.filter(f => f.id !== id));
  }

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bot & Automações</h1>
            <p className="text-sm text-gray-500">Configure fluxos automáticos para responder e qualificar visitantes</p>
          </div>
          <button
            onClick={() => setEditing({ name: '', trigger_type: 'new_conversation', steps: [], enabled: true })}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Novo Fluxo
          </button>
        </div>

        {/* Editor */}
        {editing && (
          <div className="bg-white rounded-[2rem] border-2 border-indigo-200 shadow-md p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-5">{editing.id ? 'Editar Fluxo' : 'Novo Fluxo'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Nome do Fluxo</label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                  value={editing.name || ''}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Ex: Boas-vindas automático"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Gatilho</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
                    value={editing.trigger_type || 'new_conversation'}
                    onChange={e => setEditing({ ...editing, trigger_type: e.target.value as any })}
                  >
                    {Object.entries(TRIGGER_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                {editing.trigger_type === 'keyword' && (
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Palavra-chave</label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                      value={editing.trigger_value || ''}
                      onChange={e => setEditing({ ...editing, trigger_value: e.target.value })}
                      placeholder="ex: preço, suporte..."
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-2">Passos do Fluxo</label>
                <StepEditor
                  steps={editing.steps || []}
                  onChange={steps => setEditing({ ...editing, steps })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-1">
                  <X className="w-4 h-4" /> Cancelar
                </button>
                <button onClick={save} disabled={saving} className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-1">
                  <Check className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : flows.length === 0 && !editing ? (
          <div className="text-center py-16">
            <Bot className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Nenhum fluxo criado ainda</p>
            <button onClick={() => setEditing({ name: '', trigger_type: 'new_conversation', steps: [], enabled: true })} className="mt-3 text-indigo-600 text-sm font-bold hover:underline">
              Criar primeiro fluxo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {flows.map(flow => (
              <div key={flow.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    flow.enabled ? 'bg-indigo-100' : 'bg-gray-100'
                  )}>
                    <Bot className={cn('w-5 h-5', flow.enabled ? 'text-indigo-600' : 'text-gray-400')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{flow.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{TRIGGER_LABELS[flow.trigger_type]}</span>
                      {flow.trigger_value && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">{flow.trigger_value}</span>
                      )}
                      <span className="text-xs text-gray-400">• {flow.steps.length} passo{flow.steps.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleEnabled(flow)} className="transition">
                      {flow.enabled
                        ? <ToggleRight className="w-8 h-8 text-indigo-600" />
                        : <ToggleLeft className="w-8 h-8 text-gray-300" />
                      }
                    </button>
                    <button
                      onClick={() => setEditing(flow)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFlow(flow.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpanded(expanded === flow.id ? null : flow.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition"
                    >
                      {expanded === flow.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {expanded === flow.id && flow.steps.length > 0 && (
                  <div className="px-5 pb-5 space-y-2 border-t border-gray-50 pt-4">
                    {flow.steps.map((step, i) => {
                      const Icon = STEP_ICONS[step.type] || MessageSquare;
                      return (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5 text-indigo-500" />
                          </div>
                          <span className="text-gray-500">{STEP_LABELS[step.type]}</span>
                          {step.value && <span className="text-gray-800 font-medium">"{step.value}"</span>}
                          {step.delay ? <span className="text-gray-400 text-xs">após {step.delay}s</span> : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
