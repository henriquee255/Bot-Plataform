'use client';
import { useEffect, useState, useRef } from 'react';
import { adminApi } from '@/lib/api';
import {
    Search,
    BadgeCheck,
    ShieldAlert,
    Users,
    RefreshCw,
    Trash2,
    Building2,
    X,
    CheckCircle,
    AlertCircle,
    CreditCard,
    Calendar,
    Globe,
    MoreVertical,
    Eye,
    UserCheck,
    TrendingUp,
    MessageSquare,
    User,
    Mail,
    Wifi,
    WifiOff,
    Clock,
    Filter,
    ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Company {
    id: string;
    name: string;
    slug: string;
    status: string;
    plan: string;
    created_at: string;
    agent_count?: number;
    branding?: { logo_url?: string };
    email?: string;
    website?: string;
    settings?: Record<string, any>;
}

interface CompanyDetail extends Company {
    members?: any[];
    member_count?: number;
    owner?: { id: string; full_name: string; email: string } | null;
    whatsapp_channels?: number;
    last_access?: string | null;
    plan_expires_at?: string | null;
}

// ─── Plan Badge ───────────────────────────────────────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        free:       { label: 'Free',       cls: 'bg-gray-700 text-gray-300 border-gray-600' },
        monthly:    { label: 'Mensal',     cls: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
        annual:     { label: 'Anual',      cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
        lifetime:   { label: 'Vitalício', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
        starter:    { label: 'Starter',   cls: 'bg-teal-500/15 text-teal-400 border-teal-500/30' },
        pro:        { label: 'Pro',        cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
        enterprise: { label: 'Enterprise', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
        trial:      { label: 'Trial',      cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    };
    const cfg = map[plan] ?? { label: plan ?? '—', cls: 'bg-gray-700 text-gray-400 border-gray-600' };
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border', cfg.cls)}>
            <CreditCard className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string; icon: any }> = {
        active:    { label: 'Ativa',    cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: BadgeCheck },
        suspended: { label: 'Suspensa', cls: 'bg-red-500/15 text-red-400 border-red-500/30',             icon: ShieldAlert },
        trial:     { label: 'Trial',    cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',    icon: Clock },
    };
    const cfg = map[status] ?? map['suspended'];
    const Icon = cfg.icon;
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border', cfg.cls)}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, iconCls }: { label: string; value: number | string; sub?: string; icon: any; iconCls: string }) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', iconCls)}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-white text-2xl font-black leading-none">{value}</p>
                {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ─── Actions Dropdown ─────────────────────────────────────────────────────────
function ActionsMenu({
    company,
    onDetails,
    onToggleStatus,
    onMembers,
    onChangePlan,
}: {
    company: Company;
    onDetails: () => void;
    onToggleStatus: () => void;
    onMembers: () => void;
    onChangePlan: () => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition"
                title="Ações"
            >
                <MoreVertical className="w-4 h-4" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                    <button
                        onClick={() => { setOpen(false); onDetails(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition text-left"
                    >
                        <Eye className="w-4 h-4 text-blue-400" />
                        Ver detalhes
                    </button>
                    <button
                        onClick={() => { setOpen(false); onMembers(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition text-left"
                    >
                        <Users className="w-4 h-4 text-purple-400" />
                        Ver membros
                    </button>
                    <button
                        onClick={() => { setOpen(false); onChangePlan(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition text-left"
                    >
                        <CreditCard className="w-4 h-4 text-indigo-400" />
                        Alterar plano
                    </button>
                    <div className="border-t border-gray-700" />
                    <button
                        onClick={() => { setOpen(false); onToggleStatus(); }}
                        className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 text-sm transition text-left',
                            company.status === 'active'
                                ? 'text-red-400 hover:bg-red-500/10'
                                : 'text-emerald-400 hover:bg-emerald-500/10'
                        )}
                    >
                        {company.status === 'active'
                            ? <ShieldAlert className="w-4 h-4" />
                            : <BadgeCheck className="w-4 h-4" />}
                        {company.status === 'active' ? 'Suspender empresa' : 'Ativar empresa'}
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Company Detail Modal ─────────────────────────────────────────────────────
function CompanyModal({
    companyId,
    initialName,
    onClose,
    onRefresh,
    defaultTab,
}: {
    companyId: string;
    initialName: string;
    onClose: () => void;
    onRefresh: () => void;
    defaultTab?: 'details' | 'members' | 'plan';
}) {
    const [detail, setDetail] = useState<CompanyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [plan, setPlan] = useState('free');
    const [tab, setTab] = useState<'details' | 'members' | 'plan'>(defaultTab || 'details');
    const [toast, setToast] = useState<string | null>(null);

    function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

    async function loadDetail() {
        setLoading(true);
        try {
            const data = await adminApi.getCompany(companyId);
            setDetail(data);
            setPlan(data.plan || 'free');
        } catch { showToast('Erro ao carregar detalhes'); }
        finally { setLoading(false); }
    }

    useEffect(() => { loadDetail(); }, [companyId]);

    async function handleToggleStatus() {
        if (!detail) return;
        const next = detail.status === 'active' ? 'suspended' : 'active';
        if (!confirm(`Confirmar: alterar status para "${next}"?`)) return;
        try {
            if (next === 'suspended') await adminApi.suspendCompany(detail.id);
            else await adminApi.activateCompany(detail.id);
            showToast('Status atualizado');
            onRefresh();
            loadDetail();
        } catch { showToast('Erro ao alterar status'); }
    }

    async function handleSavePlan() {
        if (!detail) return;
        setSaving(true);
        try {
            await adminApi.updateCompany(detail.id, { plan });
            showToast('Plano atualizado com sucesso');
            onRefresh();
            loadDetail();
        } catch { showToast('Erro ao salvar plano'); }
        finally { setSaving(false); }
    }

    async function handleDelete() {
        if (!detail) return;
        if (!confirm(`ATENÇÃO: Deletar permanentemente "${detail.name}"? Esta ação é irreversível!`)) return;
        if (!confirm('Confirmação final: deletar empresa e todos seus dados?')) return;
        try {
            await adminApi.deleteCompany(detail.id);
            showToast('Empresa deletada');
            onRefresh();
            onClose();
        } catch { showToast('Erro ao deletar empresa'); }
    }

    const tabs = [
        { key: 'details', label: 'Detalhes' },
        { key: 'members', label: `Membros${detail ? ` (${detail.member_count ?? detail.members?.length ?? 0})` : ''}` },
        { key: 'plan', label: 'Plano & Ações' },
    ] as const;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-[480px] bg-gray-900 border-l border-gray-700 z-50 overflow-y-auto shadow-2xl flex flex-col">
                {toast && (
                    <div className="fixed top-4 right-4 bg-gray-800 border border-gray-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl z-[60]">
                        {toast}
                    </div>
                )}

                {/* Header */}
                <div className="p-5 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center font-black text-gray-300 text-sm">
                            {initialName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-white font-black text-base leading-none">{detail?.name ?? initialName}</h2>
                            <p className="text-gray-500 text-xs font-mono mt-0.5">slug: {detail?.slug ?? '...'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800 flex-shrink-0">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={cn(
                                'flex-1 py-3 text-xs font-black uppercase tracking-widest transition border-b-2',
                                tab === t.key
                                    ? 'text-white border-red-600'
                                    : 'text-gray-500 border-transparent hover:text-gray-300'
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : detail ? (
                    <div className="flex-1 overflow-y-auto">
                        {/* ── TAB: Details ── */}
                        {tab === 'details' && (
                            <div className="p-6 space-y-4">
                                {/* Status + Plan */}
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <StatusBadge status={detail.status} />
                                    <PlanBadge plan={detail.plan} />
                                </div>

                                {/* Info Grid */}
                                <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
                                    <div className="divide-y divide-gray-700/50">
                                        <InfoRow icon={Building2} label="Nome" value={detail.name} />
                                        <InfoRow icon={Calendar} label="Criada em" value={new Date(detail.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} />
                                        {detail.email && <InfoRow icon={Mail} label="E-mail" value={detail.email} />}
                                        {detail.website && <InfoRow icon={Globe} label="Website" value={detail.website} link />}
                                    </div>
                                </div>

                                {/* Owner */}
                                <div>
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Dono / Responsável</p>
                                    {detail.owner ? (
                                        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gray-700 flex items-center justify-center font-black text-gray-300 text-sm flex-shrink-0">
                                                {detail.owner.full_name?.[0]?.toUpperCase() ?? '?'}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-bold leading-none mb-0.5">{detail.owner.full_name}</p>
                                                <p className="text-gray-400 text-xs">{detail.owner.email}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-600 text-sm">Nenhum dono encontrado</p>
                                    )}
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-3">
                                    <MiniStat icon={Users} label="Membros" value={detail.member_count ?? detail.members?.length ?? 0} color="blue" />
                                    <MiniStat icon={MessageSquare} label="WhatsApp" value={detail.whatsapp_channels ?? 0} color="green" />
                                    <MiniStat icon={Clock} label="Último Acesso" value={detail.last_access ? new Date(detail.last_access).toLocaleDateString('pt-BR') : '—'} color="gray" small />
                                </div>

                                {/* Branding */}
                                {detail.branding?.logo_url && (
                                    <div>
                                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Logo</p>
                                        <img src={detail.branding.logo_url} alt="Logo" className="h-12 object-contain rounded-xl bg-gray-800 p-2 border border-gray-700" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB: Members ── */}
                        {tab === 'members' && (
                            <div className="p-4">
                                {!detail.members || detail.members.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                                        <p className="text-gray-500 font-bold text-sm">Nenhum membro encontrado</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {detail.members.map((m: any) => (
                                            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-700/50 hover:bg-gray-800/60 transition">
                                                <div className="w-9 h-9 rounded-xl bg-gray-700 flex items-center justify-center font-black text-gray-300 text-sm flex-shrink-0">
                                                    {m.full_name?.[0]?.toUpperCase() ?? '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-bold leading-none mb-0.5 truncate">{m.full_name}</p>
                                                    <p className="text-gray-500 text-xs truncate">{m.email}</p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className={cn(
                                                        'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded',
                                                        m.role === 'owner' ? 'bg-purple-500/20 text-purple-400' :
                                                        m.role === 'admin' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-gray-700 text-gray-400'
                                                    )}>
                                                        {m.role}
                                                    </span>
                                                    <div className={cn(
                                                        'w-2 h-2 rounded-full',
                                                        m.status === 'active' || m.is_active ? 'bg-emerald-500' : 'bg-gray-600'
                                                    )} title={m.status} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB: Plan & Actions ── */}
                        {tab === 'plan' && (
                            <div className="p-6 space-y-5">
                                {/* Current Plan */}
                                <div>
                                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-3">Plano Atual</p>
                                    <div className="flex items-center gap-3">
                                        <PlanBadge plan={detail.plan} />
                                        {detail.plan_expires_at && (
                                            <span className="text-gray-500 text-xs">Expira: {new Date(detail.plan_expires_at).toLocaleDateString('pt-BR')}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Change Plan */}
                                <div>
                                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-3">Alterar Plano</p>
                                    <div className="flex gap-2">
                                        <select
                                            value={plan}
                                            onChange={e => setPlan(e.target.value)}
                                            className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                                        >
                                            <option value="free">Free</option>
                                            <option value="trial">Trial</option>
                                            <option value="monthly">Mensal</option>
                                            <option value="annual">Anual</option>
                                            <option value="lifetime">Vitalício</option>
                                            <option value="starter">Starter</option>
                                            <option value="pro">Pro</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                        <button
                                            onClick={handleSavePlan}
                                            disabled={saving || plan === detail.plan}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-40"
                                        >
                                            {saving ? '...' : 'Salvar'}
                                        </button>
                                    </div>
                                </div>

                                {/* Status Toggle */}
                                <div className="border-t border-gray-800 pt-5">
                                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-3">Ações</p>
                                    <div className="space-y-2">
                                        <button
                                            onClick={handleToggleStatus}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition border',
                                                detail.status === 'active'
                                                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                            )}
                                        >
                                            {detail.status === 'active' ? <ShieldAlert className="w-4 h-4" /> : <BadgeCheck className="w-4 h-4" />}
                                            {detail.status === 'active' ? 'Suspender Empresa' : 'Ativar Empresa'}
                                        </button>

                                        <button
                                            onClick={handleDelete}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Deletar Empresa Permanentemente
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-500">Empresa não encontrada</p>
                    </div>
                )}
            </div>
        </>
    );
}

function InfoRow({ icon: Icon, label, value, link }: { icon: any; label: string; value: string; link?: boolean }) {
    return (
        <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                <Icon className="w-3.5 h-3.5" />
                {label}
            </div>
            {link ? (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm truncate max-w-[220px]">{value}</a>
            ) : (
                <span className="text-white text-sm font-medium truncate max-w-[220px]">{value}</span>
            )}
        </div>
    );
}

function MiniStat({ icon: Icon, label, value, color, small }: { icon: any; label: string; value: any; color: string; small?: boolean }) {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-500/10 text-blue-400',
        green: 'bg-emerald-500/10 text-emerald-400',
        gray: 'bg-gray-800 text-gray-400',
    };
    return (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-3 text-center">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5', colorMap[color])}>
                <Icon className="w-4 h-4" />
            </div>
            <p className={cn('text-white font-black leading-none', small ? 'text-xs' : 'text-xl')}>{value}</p>
            <p className="text-gray-600 text-[9px] uppercase tracking-widest mt-1">{label}</p>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type StatusFilter = 'all' | 'active' | 'suspended' | 'trial';
type PlanFilter = 'all' | 'free' | 'trial' | 'monthly' | 'annual' | 'lifetime' | 'starter' | 'pro' | 'enterprise';

interface ModalState {
    companyId: string;
    name: string;
    tab: 'details' | 'members' | 'plan';
}

export default function AdminCompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
    const [modal, setModal] = useState<ModalState | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    // Stats
    const [stats, setStats] = useState<{ totalCompanies: number; activeCompanies: number; suspendedCompanies: number; growth: { companies: number } } | null>(null);
    const [growthThisMonth, setGrowthThisMonth] = useState(0);

    useEffect(() => {
        loadCompanies();
        loadStats();
    }, []);

    async function loadCompanies() {
        setLoading(true);
        try {
            const data = await adminApi.listCompanies();
            setCompanies(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function loadStats() {
        try {
            const [s, g] = await Promise.all([adminApi.getStats(), adminApi.getGrowthStats(30)]);
            setStats(s);
            setGrowthThisMonth(g.newCompanies ?? 0);
        } catch { /* silent */ }
    }

    function showToast(type: 'success' | 'error', msg: string) {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    }

    async function handleToggleStatus(id: string, currentStatus: string) {
        const next = currentStatus === 'active' ? 'suspended' : 'active';
        if (!confirm(`Confirmar: alterar status para "${next}"?`)) return;
        try {
            if (next === 'suspended') await adminApi.suspendCompany(id);
            else await adminApi.activateCompany(id);
            loadCompanies();
            loadStats();
        } catch { showToast('error', 'Erro ao alterar status'); }
    }

    const filtered = companies.filter(c => {
        const q = search.toLowerCase();
        const matchSearch = !search ||
            c.name.toLowerCase().includes(q) ||
            c.slug.toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q);
        const matchStatus = statusFilter === 'all' ? true : c.status === statusFilter;
        const matchPlan = planFilter === 'all' ? true : c.plan === planFilter;
        return matchSearch && matchStatus && matchPlan;
    });

    const counts = {
        all: companies.length,
        active: companies.filter(c => c.status === 'active').length,
        suspended: companies.filter(c => c.status === 'suspended').length,
        trial: companies.filter(c => c.status === 'trial').length,
    };

    const planOptions: { value: PlanFilter; label: string }[] = [
        { value: 'all', label: 'Todos os Planos' },
        { value: 'free', label: 'Free' },
        { value: 'trial', label: 'Trial' },
        { value: 'monthly', label: 'Mensal' },
        { value: 'annual', label: 'Anual' },
        { value: 'lifetime', label: 'Vitalício' },
        { value: 'starter', label: 'Starter' },
        { value: 'pro', label: 'Pro' },
        { value: 'enterprise', label: 'Enterprise' },
    ];

    return (
        <div className="min-h-screen bg-gray-950 p-8 pb-16">
            {/* Toast */}
            {toast && (
                <div className={cn(
                    'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold',
                    toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                )}>
                    {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Gestão de Empresas</h1>
                    <p className="text-gray-400 font-medium mt-1">Controle total sobre as organizações cadastradas.</p>
                </div>
                <button
                    onClick={loadCompanies}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 rounded-xl text-sm font-bold transition"
                >
                    <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                    Atualizar
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Total Empresas"
                    value={stats?.totalCompanies ?? companies.length}
                    icon={Building2}
                    iconCls="bg-gray-800 text-gray-300"
                />
                <StatCard
                    label="Ativas"
                    value={stats?.activeCompanies ?? counts.active}
                    icon={BadgeCheck}
                    iconCls="bg-emerald-500/15 text-emerald-400"
                />
                <StatCard
                    label="Suspensas"
                    value={stats?.suspendedCompanies ?? counts.suspended}
                    icon={ShieldAlert}
                    iconCls="bg-red-500/15 text-red-400"
                />
                <StatCard
                    label="Crescimento"
                    value={`+${growthThisMonth}`}
                    sub="este mês (30 dias)"
                    icon={TrendingUp}
                    iconCls="bg-blue-500/15 text-blue-400"
                />
            </div>

            {/* Filters */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3">
                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-gray-800 rounded-xl p-1">
                    {(['all', 'active', 'suspended', 'trial'] as StatusFilter[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition',
                                statusFilter === f
                                    ? f === 'active' ? 'bg-emerald-600 text-white' :
                                      f === 'suspended' ? 'bg-red-600 text-white' :
                                      f === 'trial' ? 'bg-yellow-600 text-white' :
                                      'bg-white text-gray-900'
                                    : 'text-gray-400 hover:text-white'
                            )}
                        >
                            {f === 'all' ? `Todas (${counts.all})` :
                             f === 'active' ? `Ativas (${counts.active})` :
                             f === 'suspended' ? `Suspensas (${counts.suspended})` :
                             `Trial (${counts.trial})`}
                        </button>
                    ))}
                </div>

                {/* Plan Filter */}
                <div className="relative">
                    <Filter className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                        value={planFilter}
                        onChange={e => setPlanFilter(e.target.value as PlanFilter)}
                        className="pl-8 pr-8 py-2 bg-gray-800 border border-gray-700 text-white text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 appearance-none cursor-pointer"
                    >
                        {planOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, dono ou e-mail..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {(planFilter !== 'all' || statusFilter !== 'all' || search) && (
                    <button
                        onClick={() => { setSearch(''); setStatusFilter('all'); setPlanFilter('all'); }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold rounded-xl border border-red-600/30 transition"
                    >
                        <X className="w-3.5 h-3.5" />
                        Limpar
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center">
                        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 font-bold text-sm">Carregando empresas...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-16 text-center">
                        <Building2 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold">Nenhuma empresa encontrada</p>
                        <p className="text-gray-600 text-sm mt-1">Tente ajustar os filtros</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-800 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Empresa</th>
                                    <th className="px-6 py-4">Dono</th>
                                    <th className="px-6 py-4">Membros</th>
                                    <th className="px-6 py-4">Plano</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Criado em</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {filtered.map(company => (
                                    <tr key={company.id} className="hover:bg-gray-800/40 transition-colors">
                                        {/* Company */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center font-black text-gray-300 text-sm flex-shrink-0 overflow-hidden">
                                                    {company.branding?.logo_url
                                                        ? <img src={company.branding.logo_url} alt="" className="w-full h-full object-cover" />
                                                        : company.name?.slice(0, 2).toUpperCase()
                                                    }
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-sm leading-none mb-0.5">{company.name}</p>
                                                    <p className="text-gray-600 text-xs font-mono">/{company.slug}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Owner - shown from company.email as placeholder since list doesn't include owner */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <User className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                                                <span className="text-xs font-medium truncate max-w-[120px]">
                                                    {company.email || <span className="text-gray-700 italic">—</span>}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Members */}
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setModal({ companyId: company.id, name: company.name, tab: 'members' })}
                                                className="flex items-center gap-1.5 text-gray-400 hover:text-white transition group"
                                            >
                                                <Users className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-400" />
                                                <span className="text-sm font-bold">{company.agent_count ?? 0}</span>
                                            </button>
                                        </td>

                                        {/* Plan */}
                                        <td className="px-6 py-4">
                                            <PlanBadge plan={company.plan} />
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <StatusBadge status={company.status} />
                                        </td>

                                        {/* Created */}
                                        <td className="px-6 py-4">
                                            <span className="text-gray-500 text-xs font-mono">
                                                {new Date(company.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end">
                                                <ActionsMenu
                                                    company={company}
                                                    onDetails={() => setModal({ companyId: company.id, name: company.name, tab: 'details' })}
                                                    onToggleStatus={() => handleToggleStatus(company.id, company.status)}
                                                    onMembers={() => setModal({ companyId: company.id, name: company.name, tab: 'members' })}
                                                    onChangePlan={() => setModal({ companyId: company.id, name: company.name, tab: 'plan' })}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-6 py-3 border-t border-gray-800 flex items-center justify-between">
                            <p className="text-gray-600 text-xs font-bold">
                                {filtered.length} de {companies.length} empresas
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modal && (
                <CompanyModal
                    companyId={modal.companyId}
                    initialName={modal.name}
                    onClose={() => setModal(null)}
                    onRefresh={() => { loadCompanies(); loadStats(); }}
                    defaultTab={modal.tab}
                />
            )}
        </div>
    );
}
