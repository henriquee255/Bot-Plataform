'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import {
    Activity,
    RefreshCw,
    Search,
    X,
    ChevronDown,
    Building2,
    User,
    Clock,
    Filter,
    AlertCircle,
    CheckCircle,
    LogIn,
    LogOut,
    Edit3,
    Trash2,
    Plus,
    Settings,
    Shield,
    MessageSquare,
    UserCheck,
    ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ActivityItem {
    id: string;
    action: string;
    entity?: string;
    entityId?: string;
    description?: string;
    metadata?: Record<string, any>;
    user?: { id: string; full_name: string; email: string };
    company?: { id: string; name: string };
    createdAt?: string;
    created_at?: string;
    ip?: string;
}

// ─── Action Icon & Color ──────────────────────────────────────────────────────
function getActionMeta(action: string): { icon: any; color: string; label: string } {
    const a = action?.toLowerCase() ?? '';
    if (a.includes('login'))       return { icon: LogIn,          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',    label: 'Login' };
    if (a.includes('logout'))      return { icon: LogOut,         color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',    label: 'Logout' };
    if (a.includes('create') || a.includes('register') || a.includes('invite'))
                                   return { icon: Plus,           color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Criar' };
    if (a.includes('delete') || a.includes('remove'))
                                   return { icon: Trash2,         color: 'text-red-400 bg-red-500/10 border-red-500/20',       label: 'Deletar' };
    if (a.includes('update') || a.includes('edit') || a.includes('patch'))
                                   return { icon: Edit3,          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Editar' };
    if (a.includes('suspend') || a.includes('block'))
                                   return { icon: Shield,         color: 'text-red-400 bg-red-500/10 border-red-500/20',       label: 'Suspender' };
    if (a.includes('activate') || a.includes('approve'))
                                   return { icon: UserCheck,      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Ativar' };
    if (a.includes('message') || a.includes('chat'))
                                   return { icon: MessageSquare,  color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', label: 'Mensagem' };
    if (a.includes('setting') || a.includes('config'))
                                   return { icon: Settings,       color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', label: 'Config' };
    return { icon: Activity, color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', label: action };
}

// ─── Time Ago ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr?: string): string {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0)  return `${d}d atrás`;
    if (h > 0)  return `${h}h atrás`;
    if (m > 0)  return `${m}min atrás`;
    return 'agora';
}

// ─── Activity Row ─────────────────────────────────────────────────────────────
function ActivityRow({ item }: { item: ActivityItem }) {
    const meta = getActionMeta(item.action);
    const Icon = meta.icon;
    const date = item.createdAt || item.created_at;

    return (
        <div className="flex items-start gap-4 p-4 hover:bg-gray-800/40 transition rounded-xl group">
            {/* Icon */}
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 mt-0.5', meta.color)}>
                <Icon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        {/* Action + Entity */}
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-white text-sm font-bold">{item.action}</span>
                            {item.entity && (
                                <>
                                    <ArrowRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
                                    <span className="text-gray-400 text-xs font-mono bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">{item.entity}</span>
                                </>
                            )}
                        </div>

                        {/* Description */}
                        {item.description && (
                            <p className="text-gray-400 text-xs leading-relaxed mt-0.5">{item.description}</p>
                        )}

                        {/* User + Company */}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {item.user && (
                                <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                                    <User className="w-3 h-3" />
                                    <span className="text-gray-400 font-medium">{item.user.full_name}</span>
                                    <span className="text-gray-600">({item.user.email})</span>
                                </span>
                            )}
                            {item.company && (
                                <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                                    <Building2 className="w-3 h-3" />
                                    <span className="text-gray-400">{item.company.name}</span>
                                </span>
                            )}
                            {item.ip && (
                                <span className="text-gray-600 text-xs font-mono">IP: {item.ip}</span>
                            )}
                        </div>
                    </div>

                    {/* Time */}
                    <div className="text-right flex-shrink-0">
                        <p className="text-gray-400 text-xs font-mono">{timeAgo(date)}</p>
                        {date && (
                            <p className="text-gray-600 text-[10px] font-mono mt-0.5">
                                {new Date(date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── PERIOD OPTIONS ───────────────────────────────────────────────────────────
const PERIOD_OPTIONS = [
    { label: 'Últimas 50', value: 50 },
    { label: 'Últimas 100', value: 100 },
    { label: 'Últimas 200', value: 200 },
    { label: 'Últimas 500', value: 500 },
];

const ACTION_TYPES = [
    'login', 'logout', 'create', 'update', 'delete', 'suspend', 'activate', 'invite', 'message', 'settings',
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminActivityPage() {
    const [items, setItems] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(100);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.getActivity(limit);
            setItems(Array.isArray(data) ? data : data?.items ?? data?.activities ?? []);
            setLastUpdated(new Date());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => { load(); }, [load]);

    // Auto-refresh every 30s
    useEffect(() => {
        if (!autoRefresh) return;
        const id = setInterval(load, 30000);
        return () => clearInterval(id);
    }, [autoRefresh, load]);

    // Collect unique companies for filter
    const companies = Array.from(
        new Map(items.filter(i => i.company).map(i => [i.company!.id, i.company!])).values()
    );

    // Filter items
    const filtered = items.filter(item => {
        const matchSearch = !search ||
            item.action?.toLowerCase().includes(search.toLowerCase()) ||
            item.description?.toLowerCase().includes(search.toLowerCase()) ||
            item.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            item.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            item.company?.name?.toLowerCase().includes(search.toLowerCase());
        const matchAction = !actionFilter || item.action?.toLowerCase().includes(actionFilter);
        const matchCompany = !companyFilter || item.company?.id === companyFilter;
        return matchSearch && matchAction && matchCompany;
    });

    const activeFilters = [search, actionFilter, companyFilter].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-gray-950 p-8 pb-16">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Log de Atividade Global</h1>
                    <p className="text-gray-400 font-medium mt-1">Auditoria cronológica de todas as ações na plataforma.</p>
                    {lastUpdated && (
                        <p className="text-gray-600 text-xs mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Atualizado: {lastUpdated.toLocaleTimeString('pt-BR')}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {/* Auto-refresh toggle */}
                    <button
                        onClick={() => setAutoRefresh(v => !v)}
                        className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition',
                            autoRefresh
                                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30'
                                : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                        )}
                    >
                        <div className={cn('w-2 h-2 rounded-full', autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600')} />
                        {autoRefresh ? 'Live' : 'Auto-refresh'}
                    </button>
                    <button
                        onClick={load}
                        className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition"
                        title="Atualizar"
                    >
                        <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-white">{items.length}</p>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Total de Eventos</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-white">{filtered.length}</p>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Após Filtros</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-white">{companies.length}</p>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Empresas</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Buscar por ação, usuário, empresa..."
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

                {/* Action Type Filter */}
                <div className="relative">
                    <Filter className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                        value={actionFilter}
                        onChange={e => setActionFilter(e.target.value)}
                        className="pl-8 pr-8 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 appearance-none cursor-pointer"
                    >
                        <option value="">Tipo de Ação</option>
                        {ACTION_TYPES.map(t => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Company Filter */}
                {companies.length > 0 && (
                    <div className="relative">
                        <Building2 className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select
                            value={companyFilter}
                            onChange={e => setCompanyFilter(e.target.value)}
                            className="pl-8 pr-8 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 appearance-none cursor-pointer max-w-[200px]"
                        >
                            <option value="">Todas as Empresas</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                )}

                {/* Limit */}
                <div className="relative">
                    <select
                        value={limit}
                        onChange={e => setLimit(Number(e.target.value))}
                        className="pl-3 pr-8 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 appearance-none cursor-pointer"
                    >
                        {PERIOD_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {activeFilters > 0 && (
                    <button
                        onClick={() => { setSearch(''); setActionFilter(''); setCompanyFilter(''); }}
                        className="flex items-center gap-1.5 px-3 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold rounded-xl border border-red-600/30 transition"
                    >
                        <X className="w-3.5 h-3.5" />
                        Limpar ({activeFilters})
                    </button>
                )}
            </div>

            {/* Activity Feed */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                {/* Table Header */}
                <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between">
                    <span className="text-gray-500 text-xs font-black uppercase tracking-widest">
                        {filtered.length} evento{filtered.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-gray-600 text-xs">Mais recente primeiro</span>
                </div>

                {loading ? (
                    <div className="p-16 text-center">
                        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 font-bold text-sm">Carregando atividades...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-16 text-center">
                        <Activity className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold">Nenhuma atividade encontrada</p>
                        <p className="text-gray-600 text-sm mt-1">Tente ajustar os filtros</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800/50 p-2">
                        {filtered.map((item, idx) => (
                            <ActivityRow key={item.id ?? idx} item={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
