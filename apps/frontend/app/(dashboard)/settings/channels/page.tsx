'use client';
import { useEffect, useState, useCallback } from 'react';
import { channelsApi, whatsappQrApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  Plus, MessageCircle, Send, Globe, Mail, X, CheckCircle,
  Copy, Check, Wifi, WifiOff, Trash2, Edit3, AlertCircle,
  QrCode, RefreshCw, Smartphone, Info, Zap, Search,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ChannelType = 'web_widget' | 'whatsapp_meta' | 'whatsapp_qr' | 'telegram' | 'email';

interface ChannelTypeInfo {
  value: ChannelType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  badge?: string;
  badgeColor?: string;
  category: string;
}

interface Category {
  key: string;
  label: string;
  iconColor: string;
  activationTip: string;
}

const CATEGORIES: Category[] = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    iconColor: 'text-green-600',
    activationTip: 'Escaneie o QR Code pelo WhatsApp no celular em Dispositivos Vinculados → Vincular Dispositivo.',
  },
  {
    key: 'whatsapp_api',
    label: 'WhatsApp API',
    iconColor: 'text-emerald-600',
    activationTip: 'Configure o App no Meta for Developers, gere um token permanente e cole o Phone Number ID e Access Token acima.',
  },
  {
    key: 'telegram',
    label: 'Telegram',
    iconColor: 'text-blue-500',
    activationTip: 'Use o BotFather no Telegram para criar um bot: envie /newbot, escolha nome e username, copie o token gerado.',
  },
  {
    key: 'email',
    label: 'E-mail',
    iconColor: 'text-amber-600',
    activationTip: 'Configure SMTP nas configuracoes de email e ative o encaminhamento para o endereco gerado pela plataforma.',
  },
  {
    key: 'widget',
    label: 'Widget Web',
    iconColor: 'text-indigo-600',
    activationTip: 'Copie o codigo embed e cole antes do </body> no seu site. O widget aparecera automaticamente.',
  },
  {
    key: 'other',
    label: 'Outros',
    iconColor: 'text-gray-500',
    activationTip: 'Consulte a documentacao do canal para configurar a integracao corretamente.',
  },
];

const CHANNEL_TYPES: ChannelTypeInfo[] = [
  {
    value: 'web_widget',
    label: 'Widget Web',
    description: 'Chat flutuante integrado ao seu site em minutos',
    icon: Globe,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    badge: 'Recomendado',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    category: 'widget',
  },
  {
    value: 'whatsapp_meta',
    label: 'WhatsApp API Oficial',
    description: 'Meta Business Cloud API — para alto volume de mensagens',
    icon: MessageCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'Oficial Meta',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    category: 'whatsapp_api',
  },
  {
    value: 'whatsapp_qr',
    label: 'WhatsApp via QR Code',
    description: 'Conecte seu numero pessoal ou empresarial via QR Code',
    icon: QrCode,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'Rapido',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'whatsapp',
  },
  {
    value: 'telegram',
    label: 'Telegram Bot',
    description: 'Receba e responda mensagens do Telegram',
    icon: Send,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    category: 'telegram',
  },
  {
    value: 'email',
    label: 'E-mail',
    description: 'Converta emails em tickets de atendimento',
    icon: Mail,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    category: 'email',
  },
];

const defaultForm = { name: '', type: 'web_widget' as ChannelType, config: {} as Record<string, string> };

/* ------------------------------------------------------------------ */
/*  Copy button                                                          */
/* ------------------------------------------------------------------ */
function CopyButton({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className={cn(
        'flex items-center gap-1.5 bg-white hover:bg-gray-100 rounded-lg text-gray-600 transition border border-gray-200',
        small ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs font-bold',
      )}
    >
      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copiado!' : 'Copiar'}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Activation accordion                                                */
/* ------------------------------------------------------------------ */
function ActivationAccordion({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-all',
      open ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-100 bg-gray-50',
    )}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Info className={cn('w-3.5 h-3.5', open ? 'text-indigo-500' : 'text-gray-400')} />
          <span className={cn('text-xs font-semibold', open ? 'text-indigo-700' : 'text-gray-500')}>
            Como ativar: {category.label}
          </span>
        </div>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
          : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs text-indigo-800 leading-relaxed border-t border-indigo-100 pt-3">
          {category.activationTip}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  WhatsApp QR flow                                                    */
/* ------------------------------------------------------------------ */
function WhatsAppQrFlow({ channel, onUpdate }: { channel: any; onUpdate: () => void }) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const s = await whatsappQrApi.getStatus(channel.id);
      setStatus(s);
      if (s.status === 'connected' || s.status === 'error') {
        setPolling(p => { if (p) clearInterval(p); return null; });
        if (s.status === 'connected') onUpdate();
      }
    } catch { }
  }, [channel.id, onUpdate]);

  useEffect(() => {
    fetchStatus();
    return () => { if (polling) clearInterval(polling); };
  }, []);

  async function startConnect() {
    setLoading(true);
    try {
      await whatsappQrApi.connect(channel.id);
      const interval = setInterval(fetchStatus, 2000);
      setPolling(interval);
    } catch { } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Desconectar este WhatsApp?')) return;
    await whatsappQrApi.disconnect(channel.id);
    setStatus(null);
    setPolling(p => { if (p) clearInterval(p); return null; });
    onUpdate();
  }

  if (!status || status.status === 'disconnected') {
    return (
      <div className="mt-4 space-y-4">
        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <div className="text-sm text-green-800">
              <p className="font-bold mb-2">Como conectar em 3 passos:</p>
              <ol className="space-y-1.5 text-xs leading-relaxed list-decimal list-inside">
                <li>Clique em <strong>Iniciar Conexao</strong> abaixo</li>
                <li>Abra o WhatsApp no seu celular → <strong>Dispositivos vinculados</strong> → <strong>Vincular dispositivo</strong></li>
                <li>Escaneie o QR Code que aparecera aqui</li>
              </ol>
            </div>
          </div>
        </div>
        <button
          onClick={startConnect}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-semibold rounded-2xl hover:bg-green-700 transition disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
          {loading ? 'Iniciando...' : 'Iniciar Conexao'}
        </button>
      </div>
    );
  }

  if (status.status === 'connecting') {
    return (
      <div className="mt-4 flex items-center justify-center gap-3 py-6 bg-green-50 rounded-2xl border border-green-100">
        <RefreshCw className="w-5 h-5 text-green-600 animate-spin" />
        <span className="text-sm font-medium text-green-700">Iniciando conexao...</span>
      </div>
    );
  }

  if (status.status === 'qr' && status.qr) {
    return (
      <div className="mt-4 space-y-3">
        <div className="bg-green-50 p-3 rounded-2xl border border-green-100 text-center">
          <p className="text-xs font-semibold text-green-700 mb-1">Escaneie com o WhatsApp</p>
          <p className="text-[10px] text-green-600">Celular → Dispositivos vinculados → Vincular dispositivo</p>
        </div>
        <div className="flex justify-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <img src={status.qr} alt="WhatsApp QR Code" className="w-48 h-48" />
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Aguardando escaneamento...
        </div>
      </div>
    );
  }

  if (status.status === 'connected') {
    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-200">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-green-800">WhatsApp Conectado!</p>
            {status.phoneNumber && (
              <p className="text-xs text-green-600">+{status.phoneNumber}</p>
            )}
          </div>
          <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
        </div>
        <button
          onClick={handleDisconnect}
          className="w-full py-2 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition border border-red-100"
        >
          Desconectar WhatsApp
        </button>
      </div>
    );
  }

  if (status.status === 'error') {
    return (
      <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-red-700">Erro na conexao</p>
            <p className="text-[11px] text-red-600 mt-0.5">{status.error}</p>
          </div>
        </div>
        <button
          onClick={startConnect}
          className="mt-3 w-full py-2 text-xs font-semibold text-red-600 hover:bg-red-100 rounded-xl transition"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Channel Card                                                         */
/* ------------------------------------------------------------------ */
function ChannelCard({
  ch,
  apiBase,
  onEdit,
  onDelete,
  onToggle,
  onUpdate,
  expandedQr,
  setExpandedQr,
}: {
  ch: any;
  apiBase: string;
  onEdit: (ch: any) => void;
  onDelete: (id: string, name: string) => void;
  onToggle: (ch: any) => void;
  onUpdate: () => void;
  expandedQr: string | null;
  setExpandedQr: (id: string | null) => void;
}) {
  const typeInfo = CHANNEL_TYPES.find(t => t.value === ch.type) || CHANNEL_TYPES[0];
  const Icon = typeInfo.icon;
  const isQr = ch.type === 'whatsapp_qr';
  const isExpanded = expandedQr === ch.id;
  const isConnected = ch.status === 'active';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        {/* Icon */}
        <div className={cn('p-2.5 rounded-xl shrink-0', typeInfo.bg)}>
          <Icon className={cn('w-5 h-5', typeInfo.color)} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-sm">{ch.name}</h3>
            {typeInfo.badge && (
              <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', typeInfo.badgeColor)}>
                {typeInfo.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{typeInfo.label}</p>
          {/* Instance code for WhatsApp */}
          {(ch.type === 'whatsapp_qr' || ch.type === 'whatsapp_meta') && ch.config?.phone_number_id && (
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {ch.config.phone_number_id}</p>
          )}
        </div>

        {/* Status badge */}
        <span className={cn(
          'inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0',
          isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
        )}>
          <span className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-green-500' : 'bg-gray-400')} />
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isQr && (
            <button
              onClick={() => setExpandedQr(isExpanded ? null : ch.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border',
                isExpanded
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
              )}
            >
              <QrCode className="w-3.5 h-3.5" />
              {isExpanded ? 'Fechar' : 'Gerenciar'}
            </button>
          )}

          <button
            onClick={() => onToggle(ch)}
            className={cn(
              'p-2 rounded-xl transition',
              isConnected ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100',
            )}
            title={isConnected ? 'Desativar' : 'Ativar'}
          >
            {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onEdit(ch)}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
            title="Editar"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(ch.id, ch.name)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QR panel */}
      {isQr && isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-50 bg-gray-50/30">
          <WhatsAppQrFlow channel={ch} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                           */
/* ------------------------------------------------------------------ */
export default function ChannelsPage() {
  const { user } = useAuthStore();
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; form: typeof defaultForm; editId?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [expandedQr, setExpandedQr] = useState<string | null>(null);

  const apiBase = typeof window !== 'undefined'
    ? window.location.origin.replace(':3000', ':3001')
    : 'http://localhost:3001';

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await channelsApi.list();
      setChannels(data);
    } catch { setChannels([]); }
    finally { setLoading(false); }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  function openCreate(type?: ChannelType) {
    setModal({ open: true, form: { ...defaultForm, type: type || 'web_widget' }, editId: undefined });
  }

  function openEdit(ch: any) {
    setModal({ open: true, form: { name: ch.name, type: ch.type, config: ch.config || {} }, editId: ch.id });
  }

  async function handleSave() {
    if (!modal?.form.name.trim()) return;
    setSaving(true);
    try {
      if (modal.editId) {
        await channelsApi.update(modal.editId, modal.form);
        showToast('Canal atualizado!');
      } else {
        const created = await channelsApi.create(modal.form);
        if (modal.form.type === 'whatsapp_qr') {
          setExpandedQr(created.id);
        }
        showToast('Canal criado com sucesso!');
      }
      setModal(null);
      load();
    } catch { showToast('Erro ao salvar canal'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir canal "${name}"?`)) return;
    await channelsApi.remove(id);
    load();
  }

  async function handleToggle(ch: any) {
    await channelsApi.update(ch.id, { status: ch.status === 'active' ? 'inactive' : 'active' });
    load();
  }

  /* Filtered channels */
  const filtered = channels.filter(ch => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const info = CHANNEL_TYPES.find(t => t.value === ch.type);
    return (
      ch.name?.toLowerCase().includes(q) ||
      ch.type?.toLowerCase().includes(q) ||
      info?.label?.toLowerCase().includes(q)
    );
  });

  /* Group by category */
  const grouped = CATEGORIES.map(cat => {
    const items = filtered.filter(ch => {
      const info = CHANNEL_TYPES.find(t => t.value === ch.type);
      return info ? info.category === cat.key : cat.key === 'other';
    });
    return { category: cat, items };
  }).filter(g => g.items.length > 0);

  const renderConfigFields = () => {
    if (!modal) return null;
    const { type } = modal.form;
    const setConfig = (key: string, val: string) =>
      setModal(m => m ? { ...m, form: { ...m.form, config: { ...m.form.config, [key]: val } } } : m);
    const cfg = modal.form.config;

    if (type === 'whatsapp_meta') return (
      <div className="space-y-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-emerald-800 mb-2">Guia passo a passo:</p>
          <ol className="text-xs text-emerald-700 space-y-1 list-decimal list-inside leading-relaxed">
            <li>Acesse <a href="https://developers.facebook.com" target="_blank" className="underline font-semibold">Meta for Developers</a></li>
            <li>Crie um App de Business → Produto: WhatsApp</li>
            <li>Em <strong>API Setup</strong>, copie o <strong>Phone Number ID</strong></li>
            <li>Gere um <strong>Permanent Token</strong> no System User</li>
            <li>Defina um <strong>Verify Token</strong> (qualquer texto secreto)</li>
            <li>Configure o Webhook URL: <code className="bg-emerald-100 px-1 rounded font-mono text-[10px]">{apiBase}/api/webhooks/whatsapp/[canal-id]</code></li>
          </ol>
        </div>
        {[
          { key: 'phone_number_id', label: 'Phone Number ID', placeholder: '123456789012345' },
          { key: 'access_token', label: 'Access Token (Permanente)', placeholder: 'EAABxxxxxxxxxxxx...' },
          { key: 'verify_token', label: 'Verify Token', placeholder: 'meu_token_secreto_123' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">{label}</label>
            <input
              value={cfg[key] || ''} onChange={e => setConfig(key, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-mono"
            />
          </div>
        ))}
      </div>
    );

    if (type === 'whatsapp_qr') return (
      <div className="space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <QrCode className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-800">Conexao via QR Code</p>
              <p className="text-xs text-green-700 mt-1 leading-relaxed">
                Apos criar o canal, voce escaneara um QR Code com o WhatsApp para conectar.
                Funciona com qualquer numero, pessoal ou empresarial.
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center">Apos salvar, o painel de conexao abrira automaticamente</p>
      </div>
    );

    if (type === 'telegram') return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-blue-800 mb-2">Guia passo a passo:</p>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside leading-relaxed">
            <li>Abra o Telegram e pesquise por <strong>@BotFather</strong></li>
            <li>Envie o comando <code className="bg-blue-100 px-1 rounded">/newbot</code></li>
            <li>Escolha um nome e username para o bot</li>
            <li>Copie o <strong>token</strong> que o BotFather enviar</li>
            <li>Cole o token abaixo e salve</li>
          </ol>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 mb-1.5 block">Bot Token</label>
          <input
            value={cfg.bot_token || ''} onChange={e => setConfig('bot_token', e.target.value)}
            placeholder="7123456789:AABBCCDDEEFFGGHHIIJJKKLLMMNNOOPPqq"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none font-mono"
          />
        </div>
        <p className="text-xs text-gray-400">
          Webhook URL: <code className="bg-gray-100 px-1 rounded text-[10px]">{apiBase}/api/webhooks/telegram/[canal-id]</code>
        </p>
      </div>
    );

    if (type === 'web_widget') return (
      <div className="space-y-3">
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-indigo-800 mb-2">Widget pronto para usar!</p>
          <p className="text-xs text-indigo-700 mb-3">Configure o design do widget em <strong>Configuracoes → Widget</strong></p>
          <div className="bg-white rounded-xl p-3 font-mono text-[10px] text-gray-600 border border-gray-100 mb-2 leading-relaxed whitespace-pre-wrap">
            {`<!-- Cole antes do </body> -->\n<script>\n  window.ChatWidget = { key: '${user?.company?.widget_key || 'SUA-CHAVE'}' };\n</script>\n<script src="${apiBase}/api/widget/widget.js" async></script>`}
          </div>
          <div className="flex justify-end">
            <CopyButton
              text={`<!-- Cole antes do </body> -->\n<script>\n  window.ChatWidget = { key: '${user?.company?.widget_key || 'SUA-CHAVE'}' };\n</script>\n<script src="${apiBase}/api/widget/widget.js" async></script>`}
              small
            />
          </div>
        </div>
      </div>
    );

    if (type === 'email') return (
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold text-gray-600 mb-1.5 block">E-mail para receber tickets</label>
          <input
            value={cfg.email || ''} onChange={e => setConfig('email', e.target.value)}
            type="email" placeholder="suporte@suaempresa.com"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 outline-none"
          />
          <p className="text-xs text-gray-400 mt-2">
            Configure o encaminhamento de email para:{' '}
            <code className="bg-gray-100 px-1 rounded">inbox@{apiBase.replace('http://', '').replace('https://', '')}</code>
          </p>
        </div>
      </div>
    );

    return null;
  };

  return (
    <div className="p-6 pb-16 overflow-y-auto h-full">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />{toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Canais de Atendimento</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Conecte WhatsApp, Telegram, Widget e mais para centralizar seu atendimento
          </p>
        </div>
        <button
          onClick={() => openCreate()}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-2xl font-semibold text-sm hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Adicionar Canal
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar canal por nome ou tipo..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Channels list grouped by category */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Zap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-600 mb-1">Nenhum canal configurado</h3>
          <p className="text-sm text-gray-400 mb-4">Comece adicionando um canal para receber mensagens</p>
          <button
            onClick={() => openCreate()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
          >
            Adicionar Primeiro Canal
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">Nenhum canal encontrado para "{search}"</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ category, items }) => (
            <div key={category.key}>
              {/* Category header */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className={cn('text-sm font-black tracking-wide uppercase', category.iconColor)}>
                  {category.label}
                </h2>
                <span className="text-xs text-gray-400 font-medium">
                  {items.length} {items.length === 1 ? 'canal' : 'canais'}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Cards */}
              <div className="space-y-2 mb-3">
                {items.map(ch => (
                  <ChannelCard
                    key={ch.id}
                    ch={ch}
                    apiBase={apiBase}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                    onUpdate={load}
                    expandedQr={expandedQr}
                    setExpandedQr={setExpandedQr}
                  />
                ))}
              </div>

              {/* Activation accordion */}
              <ActivationAccordion category={category} />
            </div>
          ))}
        </div>
      )}

      {/* Add channel modal */}
      {modal?.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-gray-900">
                    {modal.editId ? 'Editar Canal' : 'Novo Canal de Atendimento'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Configure as informacoes do canal</p>
                </div>
                <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Nome do canal</label>
                <input
                  value={modal.form.name}
                  onChange={e => setModal(m => m ? { ...m, form: { ...m.form, name: e.target.value } } : m)}
                  placeholder="Ex: WhatsApp Principal, Widget Site, Telegram Suporte"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>

              {/* Type selector (only on create) */}
              {!modal.editId && (
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-2 block">Tipo de canal</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CHANNEL_TYPES.map(t => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.value}
                          onClick={() => setModal(m => m ? { ...m, form: { ...m.form, type: t.value, config: {} } } : m)}
                          className={cn(
                            'flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition',
                            modal.form.type === t.value
                              ? `${t.border} ${t.bg}`
                              : 'border-gray-100 hover:border-gray-200',
                          )}
                        >
                          <Icon className={cn('w-4 h-4', modal.form.type === t.value ? t.color : 'text-gray-400')} />
                          <span className={cn('text-xs font-semibold', modal.form.type === t.value ? t.color : 'text-gray-600')}>
                            {t.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Config fields */}
              {renderConfigFields()}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !modal.form.name.trim()}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition disabled:opacity-50"
              >
                {saving ? 'Salvando...' : modal.editId ? 'Salvar Alteracoes' : 'Criar Canal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
