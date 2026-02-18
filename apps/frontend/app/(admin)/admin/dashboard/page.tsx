'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import {
    TrendingUp,
    Users,
    Building2,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    AlertTriangle,
    RefreshCw,
    TrendingDown,
    Calendar,
    Star,
    Infinity,
    CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLAN_PRICES: Record<string, { monthly: number; label: string }> = {
    free:     { monthly: 0,   label: 'Gratuito' },
    monthly:  { monthly: 97,  label: 'Mensal'   },
    annual:   { monthly: 58,  label: 'Anual'    },  // R$697/ano ÷ 12
    lifetime: { monthly: 0,   label: 'Vitalício' }, // one-time, não conta no MRR
};

const PLAN_COLORS: Record<string, string> = {
    free:     'bg-slate-100 text-slate-600 border-slate-200',
    monthly:  'bg-indigo-100 text-indigo-700 border-indigo-200',
    annual:   'bg-blue-100 text-blue-700 border-blue-200',
    lifetime: 'bg-amber-100 text-amber-700 border-amber-200',
};

const PLAN_ICONS: Record<string, React.ElementType> = {
    free:     Activity,
    monthly:  Calendar,
    annual:   Star,
    lifetime: Infinity,
};

function StatCard({
    label, value, sub, icon: Icon, color, bg, trend, trendValue,
}: {
    label: string;
    value: string | number;
    sub: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
}) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', bg)}>
                    <Icon className={cn('w-5 h-5', color)} />
                </div>
                {trendValue && trend && (
                    <div className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold',
                        trend === 'up'   ? 'bg-emerald-50 text-emerald-600' :
                        trend === 'down' ? 'bg-red-50 text-red-500' :
                                          'bg-slate-50 text-slate-500',
                    )}>
                        {trend === 'up'   ? <ArrowUpRight className="w-3 h-3" /> :
                         trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                        {trendValue}
                    </div>
                )}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">{sub}</p>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse">
            <div className="w-11 h-11 rounded-xl bg-slate-100 mb-4" />
            <div className="h-2 w-20 bg-slate-100 rounded mb-2" />
            <div className="h-7 w-32 bg-slate-100 rounded mb-2" />
            <div className="h-2 w-24 bg-slate-100 rounded" />
        </div>
    );
}

export default function AdminDashboard() {
    const [stats, setStats]         = useState<any>(null);
    const [companies, setCompanies] = useState<any[]>([]);
    const [users, setUsers]         = useState<any[]>([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            adminApi.getStats(),
            adminApi.listCompanies(),
            adminApi.listUsers(),
        ])
            .then(([s, c, u]) => {
                setStats(s);
                // listCompanies/listUsers podem retornar { data, total } ou array direto
                setCompanies(Array.isArray(c) ? c.slice(0, 5) : (c?.data ?? []).slice(0, 5));
                setUsers(Array.isArray(u) ? u.slice(0, 5) : (u?.data ?? []).slice(0, 5));
            })
            .catch(() => setError('Erro ao carregar dados. Verifique o backend.'))
            .finally(() => setLoading(false));
    }, []);

    // ---- cálculo de métricas derivadas ----
    const planDist: Record<string, number> = stats?.planDistribution ?? {};
    const totalCompanies: number = stats?.totalCompanies ?? 0;
    const totalUsers: number = stats?.totalUsers ?? 0;

    const mrr = Object.entries(planDist).reduce((acc, [plan, count]) => {
        return acc + (PLAN_PRICES[plan]?.monthly ?? 0) * (count as number);
    }, 0);
    const arr = mrr * 12;

    // crescimento mock baseado em dados disponíveis
    const userGrowthPct  = stats?.growth?.users    ?? 0;
    const companyGrowth  = stats?.growth?.companies ?? 0;
    const churnRate: number = stats?.financials?.churnRate ?? 0;

    // Cancelamentos do mês: estimativa = churn * empresas pagas
    const paidCompanies = (planDist['monthly'] ?? 0) + (planDist['annual'] ?? 0);
    const estimatedCancellations = Math.round((churnRate / 100) * paidCompanies);

    // ---- render ----
    return (
        <div className="p-6 md:p-8 pb-16 max-w-screen-xl mx-auto">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Dashboard Global</h1>
                <p className="text-slate-500 text-sm mt-1">Visao executiva da plataforma em tempo real.</p>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* ── LINHA 1: Cards de métricas principais ── */}
            <section className="mb-8">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Metricas Principais</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {loading ? (
                        [1,2,3,4].map(i => <SkeletonCard key={i} />)
                    ) : (
                        <>
                            <StatCard
                                label="Total de Usuarios"
                                value={totalUsers.toLocaleString('pt-BR')}
                                sub="Todos os usuarios ativos"
                                icon={Users}
                                color="text-indigo-600"
                                bg="bg-indigo-50"
                                trend={userGrowthPct > 0 ? 'up' : 'neutral'}
                                trendValue={userGrowthPct > 0 ? `+${userGrowthPct}%` : undefined}
                            />
                            <StatCard
                                label="Total de Empresas"
                                value={totalCompanies.toLocaleString('pt-BR')}
                                sub="Contas na plataforma"
                                icon={Building2}
                                color="text-blue-600"
                                bg="bg-blue-50"
                                trend={companyGrowth > 0 ? 'up' : 'neutral'}
                                trendValue={companyGrowth > 0 ? `+${companyGrowth}%` : undefined}
                            />
                            <StatCard
                                label="MRR"
                                value={`R$ ${mrr.toLocaleString('pt-BR')}`}
                                sub="Receita Mensal Recorrente"
                                icon={DollarSign}
                                color="text-emerald-600"
                                bg="bg-emerald-50"
                                trend="up"
                                trendValue="+12%"
                            />
                            <StatCard
                                label="ARR"
                                value={`R$ ${arr.toLocaleString('pt-BR')}`}
                                sub="Receita Anual Projetada"
                                icon={TrendingUp}
                                color="text-orange-600"
                                bg="bg-orange-50"
                                trend="up"
                                trendValue="+12%"
                            />
                        </>
                    )}
                </div>
            </section>

            {/* ── LINHA 2: Distribuição de Assinaturas ── */}
            <section className="mb-8">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Distribuicao de Assinaturas</h2>
                {loading ? (
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse h-32" />
                ) : (
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {(['free', 'monthly', 'annual', 'lifetime'] as const).map(plan => {
                                const count = planDist[plan] ?? 0;
                                const pct   = totalCompanies > 0 ? Math.round((count / totalCompanies) * 100) : 0;
                                const PlanIcon = PLAN_ICONS[plan];
                                return (
                                    <div key={plan} className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <PlanIcon className="w-4 h-4 text-slate-500" />
                                                <span className="text-sm font-semibold text-slate-700">
                                                    {PLAN_PRICES[plan].label}
                                                </span>
                                            </div>
                                            <span className={cn(
                                                'text-[11px] font-bold px-2 py-0.5 rounded-full border',
                                                PLAN_COLORS[plan],
                                            )}>
                                                {count}
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    'h-full rounded-full transition-all duration-700',
                                                    plan === 'free'     ? 'bg-slate-400' :
                                                    plan === 'monthly'  ? 'bg-indigo-500' :
                                                    plan === 'annual'   ? 'bg-blue-500' :
                                                                          'bg-amber-500',
                                                )}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400">{pct}% do total</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </section>

            {/* ── LINHA 3: Metricas de saude ── */}
            <section className="mb-8">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Saude da Plataforma</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {loading ? (
                        [1,2,3].map(i => <SkeletonCard key={i} />)
                    ) : (
                        <>
                            {/* Cancelamentos */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancelamentos</p>
                                        <p className="text-xs text-slate-400">Mes atual (estimado)</p>
                                    </div>
                                </div>
                                <p className="text-3xl font-black text-slate-900">{estimatedCancellations}</p>
                                <p className="text-xs text-slate-400 mt-1">empresas canceladas</p>
                            </div>

                            {/* Reembolsos */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                        <RefreshCw className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reembolsos</p>
                                        <p className="text-xs text-slate-400">Mes atual</p>
                                    </div>
                                </div>
                                <p className="text-3xl font-black text-slate-900">0</p>
                                <p className="text-xs text-slate-400 mt-1">solicitacoes pendentes</p>
                            </div>

                            {/* Taxa de Churn */}
                            <div className={cn(
                                'rounded-2xl p-6 border shadow-sm',
                                churnRate > 3.5 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200',
                            )}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={cn(
                                        'w-10 h-10 rounded-xl flex items-center justify-center',
                                        churnRate > 3.5 ? 'bg-red-100' : 'bg-emerald-100',
                                    )}>
                                        {churnRate > 3.5
                                            ? <TrendingDown className="w-5 h-5 text-red-600" />
                                            : <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        }
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taxa de Churn</p>
                                        <p className="text-xs text-slate-500">Media mercado: 3.5%</p>
                                    </div>
                                </div>
                                <p className={cn(
                                    'text-3xl font-black',
                                    churnRate > 3.5 ? 'text-red-700' : 'text-emerald-700',
                                )}>
                                    {churnRate}%
                                </p>
                                <p className={cn(
                                    'text-xs mt-1 font-medium',
                                    churnRate > 3.5 ? 'text-red-600' : 'text-emerald-600',
                                )}>
                                    {churnRate > 3.5 ? 'Acima da media — atencao requerida' : 'Abaixo da media — otimo!'}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* ── LINHA 4+5: Tabelas ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Ultimas Empresas */}
                <section>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Ultimas Empresas Criadas</h2>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-6 animate-pulse space-y-3">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="h-10 bg-slate-100 rounded-xl" />
                                ))}
                            </div>
                        ) : companies.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Nenhuma empresa cadastrada.</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Plano</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Criada em</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {companies.map((c: any) => (
                                        <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                                                        <Building2 className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 truncate max-w-[120px]">{c.name}</p>
                                                        <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{c.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <span className={cn(
                                                    'text-[11px] font-bold px-2 py-0.5 rounded-full border',
                                                    PLAN_COLORS[c.plan ?? 'free'],
                                                )}>
                                                    {PLAN_PRICES[c.plan ?? 'free']?.label ?? c.plan}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">
                                                {c.createdAt
                                                    ? new Date(c.createdAt).toLocaleDateString('pt-BR')
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>

                {/* Ultimos Usuarios */}
                <section>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Ultimos Usuarios</h2>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-6 animate-pulse space-y-3">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="h-10 bg-slate-100 rounded-xl" />
                                ))}
                            </div>
                        ) : users.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Nenhum usuario cadastrado.</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Cargo</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Empresa</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users.map((u: any) => (
                                        <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                                                        <span className="text-white text-[11px] font-bold">
                                                            {(u.fullName ?? u.name ?? '?').charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 truncate max-w-[120px]">
                                                            {u.fullName ?? u.name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200 capitalize">
                                                    {u.role ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell truncate max-w-[100px]">
                                                {u.company?.name ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
