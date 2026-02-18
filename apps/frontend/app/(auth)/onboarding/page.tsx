'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import {
  Building2, MessageSquare, Bot, Users, Check, ChevronRight,
  ChevronLeft, Sparkles, Globe, GitBranch, ArrowRight,
  CheckCircle, Star, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Empresa' },
  { id: 2, label: 'Canal' },
  { id: 3, label: 'IA' },
  { id: 4, label: 'Bot' },
  { id: 5, label: 'Equipe' },
  { id: 6, label: 'Pronto!' },
];

const CHANNEL_OPTIONS = [
  { id: 'web_widget', name: 'Widget Web', icon: Globe, description: 'Chat no seu site ou app', color: 'from-blue-500 to-indigo-600', badge: 'Recomendado' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, description: 'Atenda via WhatsApp', color: 'from-green-500 to-emerald-600', badge: 'Popular' },
  { id: 'api', name: 'API Própria', icon: GitBranch, description: 'Integre com sua plataforma', color: 'from-purple-500 to-violet-600', badge: null },
];

const AI_PROVIDERS = [
  { id: 'skip', name: 'Depois', description: 'Configurar mais tarde', color: 'from-gray-400 to-gray-500' },
  { id: 'openai', name: 'OpenAI', description: 'GPT-4o e modelos avançados', color: 'from-green-500 to-teal-500' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude — raciocínio avançado', color: 'from-orange-500 to-amber-500' },
  { id: 'gemini', name: 'Gemini', description: 'Google AI — multimodal', color: 'from-blue-500 to-indigo-500' },
  { id: 'groq', name: 'Groq', description: 'Ultra rápido e gratuito', color: 'from-red-500 to-pink-500' },
];

export default function OnboardingPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('web_widget');
  const [selectedAI, setSelectedAI] = useState('skip');
  const [botGreeting, setBotGreeting] = useState('Olá! Bem-vindo! Como posso ajudar você hoje? 😊');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invites, setInvites] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('onboarding_completed')) {
      router.replace('/dashboard');
    }
    if (user?.company?.name) setCompanyName(user.company.name);
  }, [user, router]);

  const handleStep1 = async () => {
    if (!companyName.trim()) return;
    setSaving(true);
    try { await api.patch('/companies/me', { name: companyName.trim() }); } catch {}
    setSaving(false);
    setStep(2);
  };

  const handleStep4 = async () => {
    setSaving(true);
    try {
      await api.post('/bot-flows', {
        name: 'Fluxo Principal',
        trigger: 'first_message',
        is_active: true,
        nodes: [{ id: '1', type: 'message', content: botGreeting, next: null }],
      });
    } catch {}
    setSaving(false);
    setStep(5);
  };

  const handleStep5 = async () => {
    setSaving(true);
    const allEmails = [...invites, ...(inviteEmail.trim() ? [inviteEmail.trim()] : [])];
    for (const email of allEmails) {
      try { await api.post('/invitations', { email, role: 'agent' }); } catch {}
    }
    setSaving(false);
    setStep(6);
  };

  const addInvite = () => {
    if (inviteEmail.trim() && inviteEmail.includes('@')) {
      setInvites(p => [...p, inviteEmail.trim()]);
      setInviteEmail('');
    }
  };

  const handleFinish = () => {
    localStorage.setItem('onboarding_completed', 'true');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <span className="text-sm text-white/80 font-medium">Configuração inicial</span>
          </div>
          <h1 className="text-3xl font-black text-white">Bem-vindo à plataforma</h1>
          <p className="text-white/50 mt-2">Configure tudo em poucos minutos</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                step > s.id ? 'bg-indigo-500 text-white' :
                step === s.id ? 'bg-white text-indigo-700 shadow-lg' :
                'bg-white/10 text-white/30'
              )}>
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-8 h-0.5 mx-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: step > s.id ? '100%' : '0%' }} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {/* STEP 1 - Company */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Building2 className="w-7 h-7 text-indigo-300" />
                </div>
                <h2 className="text-2xl font-black text-white mb-1">Sua empresa</h2>
                <p className="text-white/50">Como chamamos o seu negócio?</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">Nome da empresa *</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && companyName.trim() && handleStep1()}
                  placeholder="Ex: Acme Corp, Minha Empresa..."
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition text-base"
                  autoFocus
                />
              </div>
              <button
                onClick={handleStep1}
                disabled={!companyName.trim() || saving}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continuar <ChevronRight className="w-5 h-5" /></>}
              </button>
            </div>
          )}

          {/* STEP 2 - Channel */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Globe className="w-7 h-7 text-blue-300" />
                </div>
                <h2 className="text-2xl font-black text-white mb-1">Primeiro canal</h2>
                <p className="text-white/50">Por onde seus clientes vão te contatar?</p>
              </div>
              <div className="space-y-3">
                {CHANNEL_OPTIONS.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch.id)}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all',
                      selectedChannel === ch.id ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                    )}
                  >
                    <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0', ch.color)}>
                      <ch.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{ch.name}</span>
                        {ch.badge && <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-full text-[10px] font-bold">{ch.badge}</span>}
                      </div>
                      <p className="text-white/40 text-sm">{ch.description}</p>
                    </div>
                    {selectedChannel === ch.id && <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-none px-5 py-3 border border-white/10 text-white/60 rounded-xl font-semibold hover:bg-white/5 transition flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button onClick={() => setStep(3)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
                  Continuar <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 - AI */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-purple-300" />
                </div>
                <h2 className="text-2xl font-black text-white mb-1">Inteligência Artificial</h2>
                <p className="text-white/50">Escolha o provedor de IA para automatizar atendimentos.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {AI_PROVIDERS.map(ai => (
                  <button
                    key={ai.id}
                    onClick={() => setSelectedAI(ai.id)}
                    className={cn('p-4 rounded-xl border-2 text-left transition-all', selectedAI === ai.id ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10')}
                  >
                    <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br mb-2', ai.color)} />
                    <p className="text-white font-semibold text-sm">{ai.name}</p>
                    <p className="text-white/40 text-xs mt-0.5">{ai.description}</p>
                    {selectedAI === ai.id && (
                      <div className="mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-indigo-400 text-xs font-semibold">Selecionado</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {selectedAI !== 'skip' && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white/50">
                  <Sparkles className="w-3.5 h-3.5 inline mr-1 text-indigo-400" />
                  Adicione sua API Key em <strong className="text-white/70">Configurações → IA</strong> após o onboarding.
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-none px-5 py-3 border border-white/10 text-white/60 rounded-xl font-semibold hover:bg-white/5 transition flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button onClick={() => setStep(4)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
                  Continuar <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 - Bot */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Bot className="w-7 h-7 text-orange-300" />
                </div>
                <h2 className="text-2xl font-black text-white mb-1">Mensagem do bot</h2>
                <p className="text-white/50">O que o assistente diz na primeira mensagem?</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">Mensagem de boas-vindas</label>
                <textarea
                  value={botGreeting}
                  onChange={e => setBotGreeting(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition resize-none"
                />
                <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-[10px] text-white/30 mb-2 font-semibold uppercase tracking-wider">Prévia</p>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">A</div>
                    <div className="bg-white/10 rounded-2xl rounded-tl-none px-3 py-2 max-w-xs">
                      <p className="text-white/70 text-sm">{botGreeting || '...'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-none px-5 py-3 border border-white/10 text-white/60 rounded-xl font-semibold hover:bg-white/5 transition flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button onClick={handleStep4} disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continuar <ChevronRight className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 - Team */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-emerald-300" />
                </div>
                <h2 className="text-2xl font-black text-white mb-1">Monte sua equipe</h2>
                <p className="text-white/50">Convide agentes para atender com você.</p>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addInvite()}
                    placeholder="email@empresa.com"
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                  />
                  <button onClick={addInvite} className="px-4 py-3 bg-indigo-600/80 text-white rounded-xl font-semibold hover:bg-indigo-500 transition text-sm">
                    + Add
                  </button>
                </div>
                {invites.map((email, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                    <span className="text-white/80 text-sm">{email}</span>
                    <button onClick={() => setInvites(p => p.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-400 transition text-xs">Remover</button>
                  </div>
                ))}
                <p className="text-xs text-white/30">Eles receberão um convite por e-mail para criar suas contas.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(4)} className="flex-none px-5 py-3 border border-white/10 text-white/60 rounded-xl font-semibold hover:bg-white/5 transition flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button onClick={handleStep5} disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{invites.length > 0 || inviteEmail.trim() ? 'Enviar convites' : 'Pular'} <ChevronRight className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 6 - Done */}
          {step === 6 && (
            <div className="text-center space-y-6 py-4">
              <div className="relative inline-flex">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-900/50 mx-auto">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-900 fill-yellow-900" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-black text-white mb-2">Tudo pronto! 🎉</h2>
                <p className="text-white/50">Sua plataforma está configurada e pronta.</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-left">
                {[
                  { icon: Building2, label: 'Empresa', value: companyName || 'Configurada', color: 'text-indigo-400' },
                  { icon: Globe, label: 'Canal', value: CHANNEL_OPTIONS.find(c => c.id === selectedChannel)?.name || 'Widget', color: 'text-blue-400' },
                  { icon: Sparkles, label: 'IA', value: selectedAI === 'skip' ? 'A configurar' : AI_PROVIDERS.find(a => a.id === selectedAI)?.name || '', color: 'text-purple-400' },
                ].map(item => (
                  <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <item.icon className={cn('w-4 h-4 mb-1.5', item.color)} />
                    <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">{item.label}</p>
                    <p className="text-white/80 text-xs font-semibold mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={handleFinish}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4 rounded-xl font-black text-base transition flex items-center justify-center gap-3"
              >
                Acessar a plataforma
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-white/20 text-xs">Você pode alterar qualquer configuração a qualquer momento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
