'use client';
import { useEffect, useState } from 'react';
import { companyApi, sectorsApi } from '@/lib/api';
import {
  Check,
  Copy,
  Code2,
  Palette,
  MessageSquare,
  FormInput,
  Monitor,
  Info,
  Mail,
  Phone,
  User,
  CreditCard,
  GripVertical,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  Building2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'install' | 'design' | 'messaging' | 'form' | 'sectors';

interface PreChatField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'cpf';
  placeholder: string;
  required: boolean;
  enabled: boolean;
}

const DEFAULT_FIELDS: PreChatField[] = [
  { key: 'full_name', label: 'Nome completo', type: 'text', placeholder: 'Seu nome...', required: true, enabled: true },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'seu@email.com', required: true, enabled: true },
  { key: 'phone', label: 'Celular / WhatsApp', type: 'tel', placeholder: '(11) 99999-9999', required: false, enabled: false },
  { key: 'cpf', label: 'CPF', type: 'cpf', placeholder: '000.000.000-00', required: false, enabled: false },
];

const FIELD_ICONS: Record<string, React.ElementType> = {
  full_name: User,
  email: Mail,
  phone: Phone,
  cpf: CreditCard,
};

export default function WidgetSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('install');
  const [company, setCompany] = useState<any>(null);
  const [sectors, setSectors] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Design settings
  const [design, setDesign] = useState({
    primaryColor: '#6366f1',
    position: 'bottom-right' as 'bottom-right' | 'bottom-left',
    balloonText: 'Dúvidas? Fale com a gente!',
    showBalloon: true,
  });

  // Messaging settings
  const [messaging, setMessaging] = useState({
    welcomeMessage: 'Olá! 👋 Como podemos ajudar?',
    offlineMessage: 'No momento estamos offline. Deixe sua mensagem e retornaremos em breve!',
    teamName: 'Suporte',
  });

  // Pre-chat form
  const [preChatEnabled, setPreChatEnabled] = useState(true);
  const [fields, setFields] = useState<PreChatField[]>(DEFAULT_FIELDS);

  // Sector selection
  const [sectorSelectionEnabled, setSectorSelectionEnabled] = useState(false);
  const [sectorSelectionTitle, setSectorSelectionTitle] = useState('Como podemos te direcionar?');

  useEffect(() => {
    Promise.all([companyApi.get(), sectorsApi?.list?.() || Promise.resolve([])]).then(([c, s]) => {
      setCompany(c);
      setSectors(s || []);
      const wc = c.widget_config || {};
      const cs = c.settings || {};

      if (wc.design) setDesign(wc.design);
      if (wc.messaging) setMessaging(wc.messaging);
      if (wc.pre_chat_enabled !== undefined) setPreChatEnabled(wc.pre_chat_enabled);
      if (wc.fields) setFields(wc.fields);
      if (wc.sector_selection_enabled !== undefined) setSectorSelectionEnabled(wc.sector_selection_enabled);
      if (wc.sector_selection_title) setSectorSelectionTitle(wc.sector_selection_title);

      // Fallback to old settings
      if (!wc.design && cs.primaryColor) {
        setDesign(d => ({ ...d, primaryColor: cs.primaryColor, position: cs.position || 'bottom-right', balloonText: cs.balloonText || d.balloonText }));
      }
      if (!wc.messaging && cs.welcomeMessage) {
        setMessaging(m => ({ ...m, welcomeMessage: cs.welcomeMessage }));
      }
    }).finally(() => setLoading(false));
  }, []);

  const apiUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host.replace(':3000', ':3001')}`
    : 'http://localhost:3001';

  const embedCode = company
    ? `<!-- Chat Widget -->
<script>
  window.ChatWidget = {
    key: '${company.widget_key}',
    serverUrl: '${apiUrl}'
  };
</script>
<script src="${apiUrl}/api/widget/widget.js" async></script>`
    : '';

  function copyCode() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveAll() {
    setSaving(true);
    try {
      await companyApi.updateWidgetConfig({
        design,
        messaging,
        pre_chat_enabled: preChatEnabled,
        fields,
        sector_selection_enabled: sectorSelectionEnabled,
        sector_selection_title: sectorSelectionTitle,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  function toggleField(key: string, enabled: boolean) {
    setFields(fs => fs.map(f => f.key === key ? { ...f, enabled } : f));
  }

  function setFieldRequired(key: string, required: boolean) {
    setFields(fs => fs.map(f => f.key === key ? { ...f, required } : f));
  }

  const enabledFields = fields.filter(f => f.enabled);

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 h-full overflow-hidden bg-gray-50/50">
      <div className="max-w-6xl mx-auto h-full flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Widget de Chat</h1>
            <p className="text-sm text-gray-400 mt-0.5">Configure o widget que aparece no seu site</p>
          </div>
          <button
            onClick={saveAll}
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {saved ? <Check className="w-4 h-4" /> : null}
            {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex gap-6">
          {/* Left: Settings */}
          <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-2 overflow-x-auto">
              {[
                { id: 'install', label: 'Instalação', icon: Code2 },
                { id: 'design', label: 'Design', icon: Palette },
                { id: 'messaging', label: 'Mensagens', icon: MessageSquare },
                { id: 'form', label: 'Formulário Pré-chat', icon: FormInput },
                { id: 'sectors', label: 'Departamentos', icon: Building2 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all relative whitespace-nowrap',
                    activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* INSTALAÇÃO */}
              {activeTab === 'install' && (
                <div className="space-y-5">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-bold text-blue-900 mb-1">Como instalar em 3 passos</p>
                      <ol className="text-blue-700 space-y-1 text-xs leading-relaxed list-decimal list-inside">
                        <li>Copie o código abaixo</li>
                        <li>Cole antes do fechamento da tag <code className="bg-blue-100 px-1 rounded font-mono">&lt;/body&gt;</code> ou dentro do <code className="bg-blue-100 px-1 rounded font-mono">&lt;head&gt;</code></li>
                        <li>Salve e publique seu site — o widget aparecerá automaticamente!</li>
                      </ol>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-800 text-sm">Seu código único</h3>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Pronto para usar</span>
                    </div>
                    <div className="relative">
                      <pre className="bg-gray-900 text-green-400 text-xs rounded-2xl p-5 overflow-x-auto leading-relaxed font-mono">
                        {embedCode}
                      </pre>
                      <button
                        onClick={copyCode}
                        className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  {/* Platform guides */}
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm mb-3">Guias de plataforma</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { name: 'WordPress', desc: 'Adicione via plugin ou no tema', icon: '🟦' },
                        { name: 'Shopify', desc: 'Cole no theme.liquid', icon: '🟢' },
                        { name: 'Wix', desc: 'Use o editor de HTML', icon: '🟣' },
                        { name: 'HTML simples', desc: 'Cole antes do </body>', icon: '🟠' },
                        { name: 'React / Next.js', desc: 'Use useEffect ou Script', icon: '⚛️' },
                        { name: 'Webflow', desc: 'Custom code section', icon: '🔷' },
                      ].map(p => (
                        <div key={p.name} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-lg mb-1">{p.icon}</div>
                          <p className="text-xs font-bold text-gray-700">{p.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* DESIGN */}
              {activeTab === 'design' && (
                <div className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Cor principal</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={design.primaryColor}
                        onChange={(e) => setDesign({ ...design, primaryColor: e.target.value })}
                        className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={design.primaryColor}
                        onChange={e => setDesign({ ...design, primaryColor: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-xl font-mono text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                      <div className="flex gap-1">
                        {['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(c => (
                          <button
                            key={c}
                            onClick={() => setDesign({ ...design, primaryColor: c })}
                            className="w-6 h-6 rounded-full border-2 transition hover:scale-110"
                            style={{ backgroundColor: c, borderColor: design.primaryColor === c ? '#333' : 'transparent' }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Posição do widget</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'bottom-right', label: '→ Direita' },
                        { value: 'bottom-left', label: '← Esquerda' },
                      ].map(p => (
                        <button
                          key={p.value}
                          onClick={() => setDesign({ ...design, position: p.value as any })}
                          className={cn(
                            'flex-1 py-2.5 rounded-xl border text-sm font-semibold transition',
                            design.position === p.value
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-700">Balão de notificação</label>
                      <button onClick={() => setDesign(d => ({ ...d, showBalloon: !d.showBalloon }))}>
                        {design.showBalloon
                          ? <ToggleRight className="w-8 h-8 text-indigo-500" />
                          : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                      </button>
                    </div>
                    {design.showBalloon && (
                      <input
                        type="text"
                        value={design.balloonText}
                        onChange={e => setDesign({ ...design, balloonText: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        placeholder="Texto do balão..."
                      />
                    )}
                  </div>
                </div>
              )}

              {/* MENSAGENS */}
              {activeTab === 'messaging' && (
                <div className="space-y-5 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Nome da equipe</label>
                    <input
                      type="text"
                      value={messaging.teamName}
                      onChange={e => setMessaging({ ...messaging, teamName: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      placeholder="Ex: Suporte, Atendimento..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Mensagem de boas-vindas</label>
                    <textarea
                      value={messaging.welcomeMessage}
                      onChange={e => setMessaging({ ...messaging, welcomeMessage: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                      placeholder="Olá! Como podemos ajudar hoje?"
                    />
                    <p className="text-[11px] text-gray-400">Aparece quando o visitante abre o chat.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Mensagem fora do horário</label>
                    <textarea
                      value={messaging.offlineMessage}
                      onChange={e => setMessaging({ ...messaging, offlineMessage: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                      placeholder="Estamos offline agora..."
                    />
                    <p className="text-[11px] text-gray-400">Exibida quando não há atendentes disponíveis.</p>
                  </div>
                </div>
              )}

              {/* FORMULÁRIO PRÉ-CHAT */}
              {activeTab === 'form' && (
                <div className="space-y-5">
                  {/* Enable/disable */}
                  <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <div>
                      <p className="font-bold text-indigo-900 text-sm">Formulário Pré-chat</p>
                      <p className="text-xs text-indigo-600 mt-0.5">Solicitar dados antes do cliente enviar a primeira mensagem</p>
                    </div>
                    <button onClick={() => setPreChatEnabled(!preChatEnabled)}>
                      {preChatEnabled
                        ? <ToggleRight className="w-10 h-10 text-indigo-500" />
                        : <ToggleLeft className="w-10 h-10 text-gray-300" />}
                    </button>
                  </div>

                  {preChatEnabled && (
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-gray-600">Campos disponíveis</p>
                      {fields.map(field => {
                        const Icon = FIELD_ICONS[field.key] || FormInput;
                        return (
                          <div
                            key={field.key}
                            className={cn(
                              'flex items-center gap-3 p-4 rounded-2xl border transition',
                              field.enabled ? 'bg-white border-indigo-100 shadow-sm' : 'bg-gray-50 border-gray-100'
                            )}
                          >
                            <div className={cn('p-2 rounded-xl', field.enabled ? 'bg-indigo-50' : 'bg-gray-100')}>
                              <Icon className={cn('w-4 h-4', field.enabled ? 'text-indigo-600' : 'text-gray-400')} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-800">{field.label}</p>
                              <p className="text-[11px] text-gray-400">{field.placeholder}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {field.enabled && (
                                <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={e => setFieldRequired(field.key, e.target.checked)}
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600"
                                  />
                                  Obrigatório
                                </label>
                              )}
                              <button onClick={() => toggleField(field.key, !field.enabled)}>
                                {field.enabled
                                  ? <ToggleRight className="w-8 h-8 text-indigo-500" />
                                  : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {enabledFields.length === 0 && (
                        <div className="text-center py-6 bg-amber-50 rounded-2xl border border-amber-100">
                          <p className="text-sm text-amber-700 font-medium">Ative pelo menos um campo para o formulário funcionar</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* DEPARTAMENTOS */}
              {activeTab === 'sectors' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                    <div>
                      <p className="font-bold text-green-900 text-sm">Seleção de Departamento</p>
                      <p className="text-xs text-green-700 mt-0.5">Cliente escolhe para qual setor quer falar antes de iniciar</p>
                    </div>
                    <button onClick={() => setSectorSelectionEnabled(!sectorSelectionEnabled)}>
                      {sectorSelectionEnabled
                        ? <ToggleRight className="w-10 h-10 text-green-500" />
                        : <ToggleLeft className="w-10 h-10 text-gray-300" />}
                    </button>
                  </div>

                  {sectorSelectionEnabled && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700">Título da seleção</label>
                        <input
                          type="text"
                          value={sectorSelectionTitle}
                          onChange={e => setSectorSelectionTitle(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                          placeholder="Ex: Como podemos te ajudar?"
                        />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-3">Setores disponíveis</p>
                        {sectors.length === 0 ? (
                          <div className="text-center py-6 bg-gray-50 rounded-2xl border border-gray-100">
                            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 font-medium">Nenhum setor criado</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Crie setores em <strong>Setores</strong> na barra lateral
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {sectors.map(sector => (
                              <div key={sector.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: sector.color || '#6366f1' }}
                                />
                                <span className="text-sm font-medium text-gray-700">{sector.name}</span>
                                <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Ativo</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                        <Zap className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700">
                          Quando ativado, o cliente verá um seletor com os setores disponíveis antes de iniciar a conversa. As mensagens são roteadas automaticamente para agentes do setor escolhido.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="w-[320px] flex flex-col gap-4 shrink-0">
            <h3 className="font-bold text-gray-400 text-[10px] uppercase tracking-widest px-2">Pré-visualização</h3>

            <div className="flex-1 bg-gray-100 rounded-3xl relative overflow-hidden border-4 border-gray-200 shadow-xl min-h-[480px]">
              {/* Browser bar */}
              <div className="h-8 bg-gray-200 border-b border-gray-300 flex items-center px-3 gap-1.5 shrink-0">
                <div className="w-2 h-2 rounded-full bg-red-300" />
                <div className="w-2 h-2 rounded-full bg-yellow-300" />
                <div className="w-2 h-2 rounded-full bg-green-300" />
                <div className="flex-1 h-4 bg-white rounded-md mx-2" />
              </div>

              {/* Page content */}
              <div className="absolute inset-0 top-8 bg-gradient-to-br from-gray-100 to-gray-200" />

              {/* Widget bubble + chat */}
              <div className={cn(
                'absolute bottom-5 flex flex-col items-end gap-2',
                design.position === 'bottom-right' ? 'right-4' : 'left-4',
              )}>
                {/* Chat window mock */}
                <div className="w-[240px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                  <div className="p-3 text-white" style={{ backgroundColor: design.primaryColor }}>
                    <p className="text-xs font-bold">{messaging.teamName}</p>
                    <p className="text-[10px] opacity-80 mt-0.5 leading-snug">{messaging.welcomeMessage}</p>
                  </div>
                  <div className="p-3 space-y-2 bg-gray-50">
                    {preChatEnabled && fields.filter(f => f.enabled).map(field => (
                      <div key={field.key} className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1.5 border border-gray-100">
                        <span className="text-[9px] text-gray-400">{field.placeholder}</span>
                        {field.required && <span className="text-[8px] text-red-400 ml-auto">*</span>}
                      </div>
                    ))}
                    {sectorSelectionEnabled && sectors.length > 0 && (
                      <div className="bg-white rounded-lg p-2 border border-gray-100">
                        <p className="text-[9px] text-gray-500 mb-1">{sectorSelectionTitle}</p>
                        {sectors.slice(0, 2).map(s => (
                          <div key={s.id} className="flex items-center gap-1 py-0.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color || '#6366f1' }} />
                            <span className="text-[9px] text-gray-600">{s.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1.5 border border-gray-100">
                      <span className="text-[9px] text-gray-300 flex-1">Digite sua mensagem...</span>
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ backgroundColor: design.primaryColor }}>
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balloon */}
                {design.showBalloon && (
                  <div className="bg-white px-3 py-1.5 rounded-xl shadow-lg text-[10px] font-medium text-gray-600 border border-gray-100">
                    {design.balloonText}
                  </div>
                )}

                {/* Bubble button */}
                <div
                  className="w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center"
                  style={{ backgroundColor: design.primaryColor }}
                >
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 text-white text-center">
              <p className="text-xs font-semibold opacity-90">
                Widget <strong>{design.position === 'bottom-right' ? 'direita' : 'esquerda'}</strong> • {design.primaryColor}
              </p>
              <p className="text-[10px] opacity-60 mt-1">
                {enabledFields.length} campo(s) no pré-chat
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
