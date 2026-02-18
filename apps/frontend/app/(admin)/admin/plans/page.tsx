'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import {
  Plus, Star, Zap, Shield, Crown, Check, X, Edit3, Trash2, Sparkles,
  Users, MessageSquare, Clock, Database, Globe, Code, Bell, BarChart3,
  GitBranch, Bot, Settings, Mail, CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FEATURES_LIST = [
  { key: 'widget_customization', label: 'Customização do Widget' },
  { key: 'custom_domain', label: 'Domínio Personalizado' },
  { key: 'api_access', label: 'Acesso à API' },
  { key: 'webhooks', label: 'Webhooks' },
  { key: 'bot_automation', label: 'Automação com Bot' },
  { key: 'knowledge_base', label: 'Base de Conhecimento' },
  { key: 'reports_advanced', label: 'Relatórios Avançados' },
  { key: 'multi_sectors', label: 'Multi-Setores' },
  { key: 'integrations', label: 'Integrações (WhatsApp, Telegram)' },
  { key: 'sla_management', label: 'Gestão de SLA' },
  { key: 'priority_support', label: 'Suporte Prioritário' },
  { key: 'white_label', label: 'White Label' },
  { key: 'remove_branding', label: 'Remover Branding' },
  { key: 'custom_email', label: 'E-mail Personalizado' },
  { key: 'satisfaction_survey', label: 'Pesquisa de Satisfação' },
];

const PLAN_COLORS = ['#4f46e5', '#7c3aed', '#dc2626', '#059669', '#d97706', '#0284c7', '#64748b'];

const defaultPlan = {
  name: '',
  slug: '',
  description: '',
  color: '#4f46e5',
  price_monthly: 0,
  price_annual: 0,
  price_lifetime: 0,
  max_agents: 5,
  max_conversations_month: 1000,
  max_contacts: 5000,
  history_days: 30,
  trial_days: 14,
  sort_order: 0,
  is_active: true,
  is_featured: false,
  features: {} as Record<string, boolean>,
};

function fmtPrice(cents: number) {
  if (cents === 0) return 'Grátis';
  return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; plan: any; isNew: boolean }>({
    open: false, plan: { ...defaultPlan }, isNew: true,
  });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await adminApi.listPlans(true);
      setPlans(data);
    } catch { setPlans([]); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setModal({ open: true, plan: { ...defaultPlan, features: {} }, isNew: true });
  }

  function openEdit(plan: any) {
    setModal({ open: true, plan: { ...plan, features: plan.features || {} }, isNew: false });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...modal.plan,
        price_monthly: Math.round(Number(modal.plan.price_monthly) * 100),
        price_annual: Math.round(Number(modal.plan.price_annual) * 100),
        price_lifetime: Math.round(Number(modal.plan.price_lifetime) * 100),
      };
      if (modal.isNew) {
        await adminApi.createPlan(payload);
      } else {
        await adminApi.updatePlan(modal.plan.id, payload);
      }
      setModal(m => ({ ...m, open: false }));
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erro ao salvar plano');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deseja excluir o plano "${name}"? Esta ação não pode ser desfeita.`)) return;
    await adminApi.deletePlan(id);
    load();
  }

  async function handleSetFeatured(id: string) {
    await adminApi.setPlanFeatured(id);
    load();
  }

  async function handleToggleActive(plan: any) {
    await adminApi.updatePlan(plan.id, { is_active: !plan.is_active });
    load();
  }

  async function handleSeedDefaults() {
    if (!confirm('Isso irá criar os planos padrão (Free, Starter, Pro, Enterprise). Continuar?')) return;
    setSeeding(true);
    try {
      await adminApi.seedPlans();
      load();
    } finally {
      setSeeding(false); }
  }

  function updatePlan(field: string, value: any) {
    setModal(m => ({
      ...m,
      plan: {
        ...m.plan,
        [field]: value,
        ...(field === 'name' && m.isNew ? { slug: slugify(value) } : {}),
      },
    }));
  }

  function toggleFeature(key: string) {
    setModal(m => ({
      ...m,
      plan: {
        ...m.plan,
        features: { ...m.plan.features, [key]: !m.plan.features[key] },
      },
    }));
  }

  if (loading) return <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Carregando planos...</div>;

  return (
    <div className="p-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Planos</h1>
          <p className="text-slate-500 font-medium">Configure preços, features e limites de cada plano.</p>
        </div>
        <div className="flex gap-3">
          {plans.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-sm transition shadow-lg shadow-amber-200 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {seeding ? 'Criando...' : 'Seed Padrão'}
            </button>
          )}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-sm transition shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Novo Plano
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[32px] border border-slate-100">
          <CreditCard className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h3 className="text-xl font-black text-slate-400 mb-2">Nenhum plano criado</h3>
          <p className="text-slate-400 mb-6">Crie planos manualmente ou use o Seed Padrão para gerar 4 planos automaticamente.</p>
          <button onClick={handleSeedDefaults} disabled={seeding}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition">
            <Sparkles className="w-4 h-4 inline mr-2" />{seeding ? 'Criando...' : 'Gerar Planos Padrão'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div key={plan.id}
              className={cn(
                'bg-white rounded-[32px] border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col',
                plan.is_featured ? 'border-2 ring-2 ring-offset-2' : 'border-slate-100',
                !plan.is_active && 'opacity-60',
              )}
              style={plan.is_featured ? { borderColor: plan.color, '--tw-ring-color': `${plan.color}40` } as any : {}}
            >
              {/* Card Header */}
              <div className="p-6 pb-4" style={{ background: `linear-gradient(135deg, ${plan.color}15, ${plan.color}05)` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: `${plan.color}20` }}>
                    <Crown className="w-6 h-6" style={{ color: plan.color }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {plan.is_featured && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-lg text-white"
                        style={{ backgroundColor: plan.color }}>
                        <Star className="w-3 h-3" fill="white" />Destaque
                      </span>
                    )}
                    <span className={cn('text-[10px] font-black uppercase px-2 py-1 rounded-lg',
                      plan.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    )}>
                      {plan.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-2">{plan.description || 'Sem descrição'}</p>

                {/* Preços */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-medium">Mensal</span>
                    <span className="font-black" style={{ color: plan.color }}>{fmtPrice(plan.price_monthly)}</span>
                  </div>
                  {plan.price_annual > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium">Anual</span>
                      <span className="font-black text-slate-700">{fmtPrice(plan.price_annual)}</span>
                    </div>
                  )}
                  {plan.price_lifetime > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium">Vitalício</span>
                      <span className="font-black text-orange-600">{fmtPrice(plan.price_lifetime)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Limites */}
              <div className="px-6 py-4 border-t border-slate-50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500"><Users className="w-3.5 h-3.5" />Agentes</div>
                  <span className="font-black text-slate-900">{plan.max_agents === 0 ? '∞' : plan.max_agents}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500"><MessageSquare className="w-3.5 h-3.5" />Conversas/mês</div>
                  <span className="font-black text-slate-900">{plan.max_conversations_month === 0 ? '∞' : plan.max_conversations_month.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500"><Database className="w-3.5 h-3.5" />Contatos</div>
                  <span className="font-black text-slate-900">{plan.max_contacts === 0 ? '∞' : plan.max_contacts.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500"><Clock className="w-3.5 h-3.5" />Histórico</div>
                  <span className="font-black text-slate-900">{plan.history_days} dias</span>
                </div>
              </div>

              {/* Features */}
              <div className="px-6 py-3 border-t border-slate-50 flex-1">
                <div className="grid grid-cols-2 gap-1">
                  {FEATURES_LIST.slice(0, 8).map(f => (
                    <div key={f.key} className="flex items-center gap-1 text-[10px]">
                      {plan.features?.[f.key]
                        ? <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        : <X className="w-3 h-3 text-slate-200 shrink-0" />}
                      <span className={plan.features?.[f.key] ? 'text-slate-700' : 'text-slate-300'}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
                <button onClick={() => openEdit(plan)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition">
                  <Edit3 className="w-3.5 h-3.5" />Editar
                </button>
                {!plan.is_featured && (
                  <button onClick={() => handleSetFeatured(plan.id)}
                    className="flex items-center gap-1.5 py-2 px-3 bg-amber-50 hover:bg-amber-100 rounded-xl text-xs font-bold text-amber-600 transition">
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => handleToggleActive(plan)}
                  className={cn('py-2 px-3 rounded-xl text-xs font-bold transition',
                    plan.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  )}>
                  {plan.is_active ? 'Desativar' : 'Ativar'}
                </button>
                <button onClick={() => handleDelete(plan.id, plan.name)}
                  className="py-2 px-3 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold text-red-600 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white px-8 py-6 border-b border-slate-100 flex items-center justify-between rounded-t-[32px]">
              <h2 className="text-xl font-black text-slate-900">
                {modal.isNew ? 'Criar Novo Plano' : `Editar: ${modal.plan.name}`}
              </h2>
              <button onClick={() => setModal(m => ({ ...m, open: false }))}
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Básico */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Informações Básicas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Nome do Plano</label>
                    <input value={modal.plan.name} onChange={e => updatePlan('name', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="Ex: Pro, Enterprise..." />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Slug</label>
                    <input value={modal.plan.slug} onChange={e => updatePlan('slug', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono" placeholder="ex: pro" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Cor de Destaque</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={modal.plan.color} onChange={e => updatePlan('color', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                      <div className="flex gap-1.5 flex-wrap">
                        {PLAN_COLORS.map(c => (
                          <button key={c} onClick={() => updatePlan('color', c)}
                            className={cn('w-6 h-6 rounded-lg transition', modal.plan.color === c && 'ring-2 ring-offset-1 ring-slate-400')}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Descrição</label>
                    <textarea value={modal.plan.description} onChange={e => updatePlan('description', e.target.value)}
                      rows={2} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Descreva o plano brevemente..." />
                  </div>
                </div>
              </div>

              {/* Preços */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Preços (R$)</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Mensal', field: 'price_monthly' },
                    { label: 'Anual', field: 'price_annual' },
                    { label: 'Vitalício', field: 'price_lifetime' },
                  ].map(({ label, field }) => (
                    <div key={field}>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">{label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
                        <input type="number" min="0" step="0.01"
                          value={modal.plan[field] / 100}
                          onChange={e => updatePlan(field, Math.round(parseFloat(e.target.value || '0') * 100))}
                          className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Limites */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Limites (0 = ilimitado)</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Máx. Agentes', field: 'max_agents' },
                    { label: 'Conversas/mês', field: 'max_conversations_month' },
                    { label: 'Contatos', field: 'max_contacts' },
                    { label: 'Histórico (dias)', field: 'history_days' },
                    { label: 'Trial (dias)', field: 'trial_days' },
                    { label: 'Ordem de exibição', field: 'sort_order' },
                  ].map(({ label, field }) => (
                    <div key={field}>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">{label}</label>
                      <input type="number" min="0" value={modal.plan[field]}
                        onChange={e => updatePlan(field, parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Features Incluídas</h3>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURES_LIST.map(f => (
                    <button key={f.key} onClick={() => toggleFeature(f.key)}
                      className={cn(
                        'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition text-left border',
                        modal.plan.features?.[f.key]
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200'
                      )}>
                      <div className={cn('w-4 h-4 rounded-md flex items-center justify-center shrink-0',
                        modal.plan.features?.[f.key] ? 'bg-indigo-600' : 'bg-slate-200'
                      )}>
                        {modal.plan.features?.[f.key] && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-4">
                {[
                  { label: 'Plano Ativo', field: 'is_active', desc: 'Disponível para novas assinaturas' },
                  { label: 'Plano em Destaque', field: 'is_featured', desc: 'Exibido como recomendado' },
                ].map(({ label, field, desc }) => (
                  <button key={field} onClick={() => updatePlan(field, !modal.plan[field])}
                    className={cn('flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition text-left',
                      modal.plan[field] ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50'
                    )}>
                    <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                      modal.plan[field] ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                    )}>
                      {modal.plan[field] && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white px-8 py-5 border-t border-slate-100 flex gap-3 rounded-b-[32px]">
              <button onClick={() => setModal(m => ({ ...m, open: false }))}
                className="flex-1 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !modal.plan.name || !modal.plan.slug}
                className="flex-1 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-sm font-bold transition disabled:opacity-50">
                {saving ? 'Salvando...' : modal.isNew ? 'Criar Plano' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
