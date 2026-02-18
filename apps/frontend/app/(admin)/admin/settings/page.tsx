'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import {
    Building2, Mail, Lock, Globe, AlertTriangle, Puzzle,
    BarChart3, Save, RefreshCw, Eye, EyeOff, CheckCircle, X,
    Info, Server, Cpu, HardDrive, Database, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Section = 'system' | 'identity' | 'smtp' | 'registration' | 'security' | 'maintenance' | 'integrations' | 'limits';

const SECTIONS: { key: Section; label: string; icon: any; color: string; desc: string }[] = [
    { key: 'system',       label: 'Sistema',            icon: Server,       color: 'text-gray-400',   desc: 'Informações da plataforma' },
    { key: 'identity',     label: 'Identidade',         icon: Building2,    color: 'text-indigo-400', desc: 'Nome, logo e cores' },
    { key: 'smtp',         label: 'SMTP / E-mail',      icon: Mail,         color: 'text-blue-400',   desc: 'Configurações de envio' },
    { key: 'registration', label: 'Cadastro',           icon: Globe,        color: 'text-emerald-400',desc: 'Registro e planos' },
    { key: 'security',     label: 'Segurança',          icon: Lock,         color: 'text-orange-400', desc: 'JWT, sessões e limites' },
    { key: 'maintenance',  label: 'Manutenção',         icon: AlertTriangle,color: 'text-red-400',    desc: 'Modo manutenção e banners' },
    { key: 'integrations', label: 'Integrações',        icon: Puzzle,       color: 'text-purple-400', desc: 'APIs externas' },
    { key: 'limits',       label: 'Limites Globais',    icon: BarChart3,    color: 'text-slate-400',  desc: 'Limites de recursos' },
];

// ─── Components ───────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={cn('relative w-11 h-6 rounded-full transition-colors flex-shrink-0', checked ? 'bg-red-600' : 'bg-gray-700')}
        >
            <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-transform',
                checked ? 'translate-x-6' : 'translate-x-1')} />
        </button>
    );
}

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 pr-10 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-red-600 outline-none placeholder-gray-600"
            />
            <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
    );
}

function InputField({ label, value, onChange, type = 'text', placeholder }: {
    label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
    return (
        <div>
            <label className="text-xs font-bold text-gray-400 mb-1.5 block">{label}</label>
            {type === 'secret'
                ? <SecretInput value={value} onChange={onChange} placeholder={placeholder} />
                : type === 'textarea'
                    ? <textarea
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        rows={3}
                        placeholder={placeholder}
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-red-600 outline-none resize-none placeholder-gray-600"
                    />
                    : <input
                        type={type}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-red-600 outline-none placeholder-gray-600"
                    />
            }
        </div>
    );
}

function NumberField({ label, value, onChange, min = 0 }: { label: string; value: any; onChange: (v: any) => void; min?: number }) {
    return (
        <div>
            <label className="text-xs font-bold text-gray-400 mb-1.5 block">{label}</label>
            <input
                type="number"
                min={min}
                value={value ?? 0}
                onChange={e => onChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-red-600 outline-none"
            />
        </div>
    );
}

function BoolField({ label, value, onChange, desc }: { label: string; value: any; onChange: (v: boolean) => void; desc?: string }) {
    const checked = !!value && value !== 'false' && value !== false;
    return (
        <div className="flex items-center justify-between py-3.5 border-b border-gray-800 last:border-0">
            <div>
                <p className="text-sm font-bold text-white">{label}</p>
                {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
            </div>
            <Toggle checked={checked} onChange={onChange} />
        </div>
    );
}

function SaveButton({ onClick, saving, label }: { onClick: () => void; saving: boolean; label: string }) {
    return (
        <button
            onClick={onClick}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50"
        >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : label}
        </button>
    );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">{title}</h4>
            {children}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<Section>('system');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [seeding, setSeeding] = useState(false);
    const [sysInfo] = useState({
        version: '1.0.0',
        node: process.version ?? 'N/A',
        uptime: null,
        env: process.env.NODE_ENV ?? 'production',
        apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
    });

    useEffect(() => { load(); }, []);

    async function load() {
        setLoading(true);
        try {
            const grouped = await adminApi.getSettings();
            const flat: Record<string, any> = {};
            for (const group of Object.values(grouped)) {
                for (const item of group as any[]) {
                    flat[item.key] = item.value;
                }
            }
            setSettings(flat);
        } catch {
            setSettings({});
        } finally {
            setLoading(false);
        }
    }

    async function handleSeedAndLoad() {
        setSeeding(true);
        try {
            await adminApi.seedSettings();
            await load();
            showToast('success', 'Configurações padrão inicializadas!');
        } catch {
            showToast('error', 'Erro ao inicializar configurações');
        } finally {
            setSeeding(false);
        }
    }

    function showToast(type: 'success' | 'error', msg: string) {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    }

    function set(key: string, value: any) {
        setSettings(s => ({ ...s, [key]: value }));
    }

    async function saveSection(keys: string[]) {
        setSaving(true);
        try {
            const payload: Record<string, any> = {};
            for (const k of keys) payload[k] = settings[k] ?? '';
            await adminApi.updateSettings(payload);
            showToast('success', 'Configurações salvas com sucesso!');
        } catch {
            showToast('error', 'Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    }

    const renderSection = () => {
        switch (activeSection) {

            case 'system':
                return (
                    <div className="space-y-6">
                        <SectionCard title="Informações da Plataforma">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Versão', value: sysInfo.version, icon: Info },
                                    { label: 'Ambiente', value: sysInfo.env, icon: Cpu },
                                    { label: 'API URL', value: sysInfo.apiUrl, icon: Server },
                                    { label: 'Node.js', value: sysInfo.node, icon: Database },
                                ].map(({ label, value, icon: Icon }) => (
                                    <div key={label} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Icon className="w-4 h-4 text-gray-500" />
                                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{label}</p>
                                        </div>
                                        <p className="text-white font-mono text-sm font-bold truncate">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        <SectionCard title="Estado do Sistema">
                            <div className="space-y-3">
                                {[
                                    { label: 'API Backend', status: true, detail: sysInfo.apiUrl },
                                    { label: 'Banco de Dados', status: Object.keys(settings).length > 0, detail: 'Configurações carregadas' },
                                    { label: 'Modo Manutenção', status: !(settings.maintenance_mode && settings.maintenance_mode !== 'false'), detail: settings.maintenance_mode && settings.maintenance_mode !== 'false' ? 'ATIVO - Usuários bloqueados!' : 'Desativado' },
                                ].map(({ label, status, detail }) => (
                                    <div key={label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                                        <div>
                                            <p className="text-white text-sm font-bold">{label}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">{detail}</p>
                                        </div>
                                        <span className={cn(
                                            'px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border',
                                            status
                                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                                : 'bg-red-500/15 text-red-400 border-red-500/30'
                                        )}>
                                            {status ? 'OK' : 'Alerta'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        <SectionCard title="Ações de Sistema">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white text-sm font-bold">Recarregar Configurações</p>
                                        <p className="text-gray-500 text-xs">Busca novamente do banco de dados</p>
                                    </div>
                                    <button
                                        onClick={load}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl border border-gray-700 transition disabled:opacity-50"
                                    >
                                        <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
                                        Recarregar
                                    </button>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                                    <div>
                                        <p className="text-white text-sm font-bold">Inicializar Configurações Padrão</p>
                                        <p className="text-gray-500 text-xs">Cria todas as configurações com valores padrão</p>
                                    </div>
                                    <button
                                        onClick={handleSeedAndLoad}
                                        disabled={seeding}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                                    >
                                        <RefreshCw className={cn('w-3.5 h-3.5', seeding && 'animate-spin')} />
                                        {seeding ? 'Inicializando...' : 'Inicializar'}
                                    </button>
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                );

            case 'identity':
                return (
                    <div className="space-y-6">
                        <SectionCard title="Identidade Visual">
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Nome da Plataforma" value={settings.platform_name ?? ''} onChange={v => set('platform_name', v)} placeholder="Chat Platform" />
                                <InputField label="Slogan / Tagline" value={settings.platform_tagline ?? ''} onChange={v => set('platform_tagline', v)} placeholder="Atendimento inteligente" />
                                <InputField label="URL do Logotipo" value={settings.platform_logo_url ?? ''} onChange={v => set('platform_logo_url', v)} placeholder="https://..." />
                                <InputField label="URL do Favicon" value={settings.platform_favicon_url ?? ''} onChange={v => set('platform_favicon_url', v)} placeholder="https://..." />
                                <div>
                                    <label className="text-xs font-bold text-gray-400 mb-1.5 block">Cor Primária</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="color"
                                            value={settings.platform_primary_color || '#dc2626'}
                                            onChange={e => set('platform_primary_color', e.target.value)}
                                            className="w-12 h-10 rounded-xl border border-gray-700 cursor-pointer bg-transparent"
                                        />
                                        <input
                                            value={settings.platform_primary_color || '#dc2626'}
                                            onChange={e => set('platform_primary_color', e.target.value)}
                                            className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-red-600 outline-none font-mono"
                                        />
                                    </div>
                                </div>
                                <InputField label="E-mail de Suporte" value={settings.platform_support_email ?? ''} onChange={v => set('platform_support_email', v)} type="email" placeholder="suporte@empresa.com" />
                                <InputField label="URL do Site" value={settings.platform_website_url ?? ''} onChange={v => set('platform_website_url', v)} placeholder="https://seusite.com" />
                            </div>
                        </SectionCard>
                        <div className="flex justify-end">
                            <SaveButton
                                onClick={() => saveSection(['platform_name', 'platform_tagline', 'platform_logo_url', 'platform_favicon_url', 'platform_primary_color', 'platform_support_email', 'platform_website_url'])}
                                saving={saving}
                                label="Salvar Identidade"
                            />
                        </div>
                    </div>
                );

            case 'smtp':
                return (
                    <div className="space-y-6">
                        <SectionCard title="Servidor SMTP">
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Host SMTP" value={settings.smtp_host ?? ''} onChange={v => set('smtp_host', v)} placeholder="smtp.gmail.com" />
                                <NumberField label="Porta" value={settings.smtp_port} onChange={v => set('smtp_port', v)} />
                                <InputField label="Usuário" value={settings.smtp_user ?? ''} onChange={v => set('smtp_user', v)} placeholder="noreply@empresa.com" />
                                <InputField label="Senha" value={settings.smtp_pass ?? ''} onChange={v => set('smtp_pass', v)} type="secret" placeholder="••••••••" />
                                <InputField label="Nome do Remetente" value={settings.smtp_from_name ?? ''} onChange={v => set('smtp_from_name', v)} placeholder="Suporte" />
                                <InputField label="E-mail do Remetente" value={settings.smtp_from_email ?? ''} onChange={v => set('smtp_from_email', v)} type="email" placeholder="noreply@empresa.com" />
                            </div>
                        </SectionCard>
                        <SectionCard title="Segurança">
                            <BoolField label="Usar TLS (porta 465)" value={settings.smtp_secure} onChange={v => set('smtp_secure', v)} desc="Ativar para conexões SSL/TLS diretas" />
                        </SectionCard>
                        <div className="flex justify-end gap-3">
                            <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-700 text-gray-300 hover:text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition">
                                <RefreshCw className="w-4 h-4" /> Testar SMTP
                            </button>
                            <SaveButton
                                onClick={() => saveSection(['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_name', 'smtp_from_email', 'smtp_secure'])}
                                saving={saving}
                                label="Salvar SMTP"
                            />
                        </div>
                    </div>
                );

            case 'registration':
                return (
                    <div className="space-y-6">
                        <SectionCard title="Controle de Acesso">
                            <BoolField label="Permitir Registro Público" value={settings.allow_public_registration} onChange={v => set('allow_public_registration', v)} desc="Permite que novas empresas se cadastrem na plataforma" />
                            <BoolField label="Exigir Verificação de E-mail" value={settings.require_email_verification} onChange={v => set('require_email_verification', v)} desc="Envia e-mail de verificação antes de ativar a conta" />
                        </SectionCard>
                        <SectionCard title="Planos e Limites">
                            <div className="mb-4">
                                <label className="text-xs font-bold text-gray-400 mb-1.5 block">Plano Padrão para Novos Cadastros</label>
                                <select
                                    value={settings.default_plan || 'free'}
                                    onChange={e => set('default_plan', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-red-600 outline-none"
                                >
                                    <option value="free">Gratuito</option>
                                    <option value="starter">Starter</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            <NumberField label="Limite Total de Empresas (0 = ilimitado)" value={settings.max_companies} onChange={v => set('max_companies', v)} />
                        </SectionCard>
                        <div className="flex justify-end">
                            <SaveButton
                                onClick={() => saveSection(['allow_public_registration', 'require_email_verification', 'default_plan', 'max_companies'])}
                                saving={saving}
                                label="Salvar Cadastro"
                            />
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-6">
                        <SectionCard title="Autenticação">
                            <div className="grid grid-cols-2 gap-4">
                                <NumberField label="Expiração do JWT (horas)" value={settings.jwt_expiry_hours} onChange={v => set('jwt_expiry_hours', v)} />
                                <NumberField label="Máx. tentativas de login" value={settings.max_login_attempts} onChange={v => set('max_login_attempts', v)} />
                                <NumberField label="Timeout de sessão (minutos)" value={settings.session_timeout_minutes} onChange={v => set('session_timeout_minutes', v)} />
                            </div>
                        </SectionCard>
                        <SectionCard title="Proteções">
                            <BoolField label="Forçar HTTPS" value={settings.force_https} onChange={v => set('force_https', v)} desc="Garante que links gerados usem HTTPS" />
                        </SectionCard>
                        <div className="flex justify-end">
                            <SaveButton
                                onClick={() => saveSection(['jwt_expiry_hours', 'max_login_attempts', 'session_timeout_minutes', 'force_https'])}
                                saving={saving}
                                label="Salvar Segurança"
                            />
                        </div>
                    </div>
                );

            case 'maintenance':
                return (
                    <div className="space-y-6">
                        <div className={cn(
                            'rounded-2xl p-6 border-2 transition-all',
                            settings.maintenance_mode && settings.maintenance_mode !== 'false'
                                ? 'bg-red-950/30 border-red-700/50'
                                : 'bg-gray-800/50 border-gray-700/50'
                        )}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className={cn('w-5 h-5', settings.maintenance_mode && settings.maintenance_mode !== 'false' ? 'text-red-400' : 'text-gray-500')} />
                                    <div>
                                        <p className="font-black text-white">Modo Manutenção</p>
                                        <p className="text-gray-500 text-xs">Bloqueia o acesso de todos os usuários à plataforma</p>
                                    </div>
                                </div>
                                <Toggle
                                    checked={!!settings.maintenance_mode && settings.maintenance_mode !== 'false' && settings.maintenance_mode !== false}
                                    onChange={v => set('maintenance_mode', v)}
                                />
                            </div>
                            {settings.maintenance_mode && settings.maintenance_mode !== 'false' && (
                                <div className="bg-red-900/40 text-red-300 text-xs font-bold px-4 py-3 rounded-xl border border-red-800/50 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    ATENÇÃO: Modo manutenção ATIVO — usuários não conseguirão fazer login!
                                </div>
                            )}
                        </div>

                        <SectionCard title="Mensagem de Manutenção">
                            <InputField
                                label="Texto exibido durante a manutenção"
                                value={settings.maintenance_message ?? ''}
                                onChange={v => set('maintenance_message', v)}
                                type="textarea"
                                placeholder="O sistema está em manutenção. Voltaremos em breve."
                            />
                        </SectionCard>

                        <SectionCard title="Banner Global">
                            <div className="space-y-4">
                                <BoolField label="Exibir Banner Global" value={settings.global_banner_enabled} onChange={v => set('global_banner_enabled', v)} desc="Mostra um aviso no topo para todos os usuários logados" />
                                <InputField
                                    label="Texto do Banner"
                                    value={settings.global_banner_text ?? ''}
                                    onChange={v => set('global_banner_text', v)}
                                    placeholder="Aviso importante para todos os usuários..."
                                />
                                <div>
                                    <label className="text-xs font-bold text-gray-400 mb-1.5 block">Tipo do Banner</label>
                                    <select
                                        value={settings.global_banner_type || 'info'}
                                        onChange={e => set('global_banner_type', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-red-600 outline-none"
                                    >
                                        <option value="info">Info (azul)</option>
                                        <option value="warning">Aviso (amarelo)</option>
                                        <option value="error">Erro (vermelho)</option>
                                        <option value="success">Sucesso (verde)</option>
                                    </select>
                                </div>
                            </div>
                        </SectionCard>

                        <div className="flex justify-end">
                            <SaveButton
                                onClick={() => saveSection(['maintenance_mode', 'maintenance_message', 'global_banner_enabled', 'global_banner_text', 'global_banner_type'])}
                                saving={saving}
                                label="Salvar Manutenção"
                            />
                        </div>
                    </div>
                );

            case 'integrations':
                return (
                    <div className="space-y-6">
                        <SectionCard title="OpenAI">
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="API Key OpenAI" value={settings.openai_api_key ?? ''} onChange={v => set('openai_api_key', v)} type="secret" placeholder="sk-..." />
                                <div>
                                    <label className="text-xs font-bold text-gray-400 mb-1.5 block">Modelo</label>
                                    <select
                                        value={settings.openai_model || 'gpt-4o-mini'}
                                        onChange={e => set('openai_model', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-red-600 outline-none"
                                    >
                                        <option value="gpt-4o">GPT-4o</option>
                                        <option value="gpt-4o-mini">GPT-4o mini</option>
                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                    </select>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard title="Stripe (Pagamentos)">
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Chave Pública" value={settings.stripe_public_key ?? ''} onChange={v => set('stripe_public_key', v)} placeholder="pk_live_..." />
                                <InputField label="Chave Secreta" value={settings.stripe_secret_key ?? ''} onChange={v => set('stripe_secret_key', v)} type="secret" placeholder="sk_live_..." />
                                <InputField label="Webhook Secret" value={settings.stripe_webhook_secret ?? ''} onChange={v => set('stripe_webhook_secret', v)} type="secret" placeholder="whsec_..." />
                            </div>
                        </SectionCard>

                        <SectionCard title="Analytics & Segurança">
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Google Analytics ID" value={settings.google_analytics_id ?? ''} onChange={v => set('google_analytics_id', v)} placeholder="G-XXXXXXXXXX" />
                                <InputField label="reCAPTCHA Site Key" value={settings.recaptcha_site_key ?? ''} onChange={v => set('recaptcha_site_key', v)} placeholder="6Le..." />
                                <InputField label="reCAPTCHA Secret Key" value={settings.recaptcha_secret_key ?? ''} onChange={v => set('recaptcha_secret_key', v)} type="secret" placeholder="6Le..." />
                            </div>
                        </SectionCard>

                        <div className="flex justify-end">
                            <SaveButton
                                onClick={() => saveSection(['openai_api_key', 'openai_model', 'stripe_public_key', 'stripe_secret_key', 'stripe_webhook_secret', 'google_analytics_id', 'recaptcha_site_key', 'recaptcha_secret_key'])}
                                saving={saving}
                                label="Salvar Integrações"
                            />
                        </div>
                    </div>
                );

            case 'limits':
                return (
                    <div className="space-y-6">
                        <SectionCard title="Limites de Recursos">
                            <div className="grid grid-cols-2 gap-4">
                                <NumberField label="Tamanho máx. de arquivo (MB)" value={settings.max_file_size_mb} onChange={v => set('max_file_size_mb', v)} />
                                <NumberField label="Comprimento máx. de mensagem (chars)" value={settings.max_message_length} onChange={v => set('max_message_length', v)} />
                                <NumberField label="Requisições por minuto por IP" value={settings.rate_limit_per_minute} onChange={v => set('rate_limit_per_minute', v)} />
                                <NumberField label="Máx. agentes por empresa (0 = ilimitado)" value={settings.max_agents_per_company} onChange={v => set('max_agents_per_company', v)} />
                                <NumberField label="Máx. canais por empresa (0 = ilimitado)" value={settings.max_channels_per_company} onChange={v => set('max_channels_per_company', v)} />
                                <NumberField label="Retenção de logs (dias)" value={settings.log_retention_days} onChange={v => set('log_retention_days', v)} />
                            </div>
                        </SectionCard>
                        <div className="flex justify-end">
                            <SaveButton
                                onClick={() => saveSection(['max_file_size_mb', 'max_message_length', 'rate_limit_per_minute', 'max_agents_per_company', 'max_channels_per_company', 'log_retention_days'])}
                                saving={saving}
                                label="Salvar Limites"
                            />
                        </div>
                    </div>
                );
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400 font-bold">Carregando configurações...</p>
            </div>
        </div>
    );

    const isEmpty = Object.keys(settings).length === 0;

    return (
        <div className="min-h-screen bg-gray-950 p-8 pb-16">
            {/* Toast */}
            {toast && (
                <div className={cn(
                    'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold',
                    toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                )}>
                    {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Configurações Globais</h1>
                    <p className="text-gray-400 font-medium mt-1">Controle central de toda a plataforma.</p>
                </div>
                {isEmpty && (
                    <button
                        onClick={handleSeedAndLoad}
                        disabled={seeding}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition shadow-lg disabled:opacity-50"
                    >
                        <RefreshCw className={cn('w-4 h-4', seeding && 'animate-spin')} />
                        {seeding ? 'Inicializando...' : 'Inicializar Padrões'}
                    </button>
                )}
            </div>

            {isEmpty ? (
                <div className="text-center py-24 bg-gray-900 rounded-[32px] border border-gray-800">
                    <RefreshCw className="w-16 h-16 text-gray-700 mx-auto mb-6" />
                    <h3 className="text-xl font-black text-gray-400 mb-2">Configurações não inicializadas</h3>
                    <p className="text-gray-600 mb-6">Clique no botão acima para criar as configurações padrão da plataforma.</p>
                </div>
            ) : (
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <aside className="w-60 shrink-0">
                        <nav className="space-y-1 sticky top-8">
                            {SECTIONS.map(s => (
                                <button
                                    key={s.key}
                                    onClick={() => setActiveSection(s.key)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all text-left',
                                        activeSection === s.key
                                            ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    )}
                                >
                                    <s.icon className={cn('w-4 h-4 flex-shrink-0', activeSection === s.key ? 'text-white' : s.color)} />
                                    <span>{s.label}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Section Header */}
                        <div className="mb-6 flex items-center gap-4">
                            {SECTIONS.filter(s => s.key === activeSection).map(s => (
                                <div key={s.key} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                                        <s.icon className={cn('w-5 h-5', s.color)} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-white">{s.label}</h2>
                                        <p className="text-xs text-gray-500">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {renderSection()}
                    </div>
                </div>
            )}
        </div>
    );
}
