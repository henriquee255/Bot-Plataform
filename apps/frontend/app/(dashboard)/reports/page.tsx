'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, MessageSquare, Users, CheckCircle,
  Clock, BarChart2, Star, ChevronDown, RefreshCw, Download,
  Activity, Zap, User, Globe
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const PERIODS = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
];

function getToken() {
  try { return JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.accessToken; } catch { return null; }
}
function getMe() {
  try { return JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.user; } catch { return null; }
}

async function fetchReport(endpoint: string, params: Record<string, string>) {
  const token = getToken();
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/api/reports/${endpoint}?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchTeam() {
  const token = getToken();
  const res = await fetch(`${API}/api/users/team`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

function Trend({ value }: { value: number }) {
  if (value === 0) return <span className="text-gray-400 text-xs">—</span>;
  const up = value > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : ''}{value}%
    </span>
  );
}

function StatCard({ icon: Icon, label, value, trend, color, sub }: {
  icon: any; label: string; value: string | number; trend?: number;
  color: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && <Trend value={trend} />}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function SimpleBar({ data, maxVal, color = 'bg-indigo-500', labelKey = 'date', valueKey = 'total' }: {
  data: any[]; maxVal: number; color?: string; labelKey?: string; valueKey?: string;
}) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Sem dados no período</div>;
  }
  return (
    <div className="flex items-end gap-1 h-32 w-full">
      {data.map((d, i) => {
        const pct = maxVal > 0 ? (d[valueKey] / maxVal) * 100 : 0;
        const label = d[labelKey] ? new Date(d[labelKey]).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '';
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
              {label}: {d[valueKey]}
            </div>
            <div
              className={`w-full ${color} rounded-t-sm transition-all`}
              style={{ height: `${Math.max(pct, 2)}%` }}
            />
            {data.length <= 14 && (
              <span className="text-[9px] text-gray-400 rotate-0 whitespace-nowrap hidden sm:block">{label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AgentRow({ agent, max }: { agent: any; max: number }) {
  const pct = max > 0 ? (agent.handled / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
        {agent.name?.charAt(0) || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-800 truncate">{agent.name}</span>
          <span className="text-xs text-gray-500 ml-2">{agent.handled} conv.</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="text-xs font-semibold text-emerald-600 w-10 text-right">{agent.resolutionRate}%</div>
    </div>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const map: Record<string, { label: string; color: string }> = {
    widget: { label: 'Widget', color: 'bg-indigo-100 text-indigo-700' },
    whatsapp: { label: 'WhatsApp', color: 'bg-emerald-100 text-emerald-700' },
    api: { label: 'API', color: 'bg-purple-100 text-purple-700' },
    telegram: { label: 'Telegram', color: 'bg-sky-100 text-sky-700' },
  };
  const info = map[channel] || { label: channel, color: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${info.color}`}>{info.label}</span>;
}

function exportCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(r => Object.values(r).map(v => `"${v}"`).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [tab, setTab] = useState<'geral' | 'individual'>('geral');
  const [period, setPeriod] = useState('30d');
  const [agentFilter, setAgentFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [convByDay, setConvByDay] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [responseTime, setResponseTime] = useState<any[]>([]);
  const [contactGrowth, setContactGrowth] = useState<any[]>([]);
  const [csat, setCsat] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [myStats, setMyStats] = useState<any>(null);

  const me = getMe();

  useEffect(() => {
    fetchTeam().then(t => setTeamMembers(Array.isArray(t) ? t : []));
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = { period };
    if (tab === 'individual' && me?.id) params.agentId = me.id;
    else if (agentFilter) params.agentId = agentFilter;

    const [ov, cbd, ag, ch, rt, cg, cs] = await Promise.all([
      fetchReport('overview', params),
      fetchReport('conversations-by-day', params),
      fetchReport('agent-performance', params),
      fetchReport('channels', params),
      fetchReport('response-time', params),
      fetchReport('contact-growth', params),
      fetchReport('csat', params),
    ]);
    setOverview(ov);
    setConvByDay(cbd || []);
    setAgents(ag || []);
    setChannels(ch || []);
    setResponseTime(rt || []);
    setContactGrowth(cg || []);
    setCsat(cs);

    // individual stats: minha performance
    if (tab === 'individual' && ag) {
      const mine = ag.find((a: any) => a.agentId === me?.id);
      setMyStats(mine || null);
    }

    setLoading(false);
  }, [period, tab, agentFilter, me?.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const maxConv = Math.max(...convByDay.map((d) => d.total), 1);
  const maxRT = Math.max(...responseTime.map((d) => d.avgMinutes), 1);
  const maxCG = Math.max(...contactGrowth.map((d) => d.newContacts), 1);
  const maxAgent = Math.max(...agents.map((a) => a.handled), 1);

  const formatMinutes = (m: number) => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  const avgRT = responseTime.length > 0
    ? Math.round(responseTime.reduce((s, d) => s + d.avgMinutes, 0) / responseTime.length)
    : 0;

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Relatórios & Analytics</h1>
            <p className="text-sm text-gray-500 mt-0.5">Métricas operacionais do seu atendimento</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Agente filter (só no tab geral) */}
            {tab === 'geral' && teamMembers.length > 0 && (
              <div className="relative">
                <select
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">Todos os agentes</option>
                  {teamMembers.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
            {/* Período */}
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {/* Export CSV */}
            <button
              onClick={() => exportCSV(agents, `relatorio-agentes-${period}.csv`)}
              title="Exportar CSV"
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={loadAll}
              disabled={loading}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab('geral')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === 'geral' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Globe className="w-4 h-4" />
            Relatório Geral
          </button>
          <button
            onClick={() => setTab('individual')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === 'individual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4" />
            Meus Relatórios
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* Individual banner */}
        {tab === 'individual' && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {me?.fullName?.charAt(0) || me?.email?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="font-semibold text-indigo-900">{me?.fullName || me?.email}</div>
              <div className="text-xs text-indigo-600">Visualizando seus dados pessoais de atendimento</div>
            </div>
            {myStats && (
              <div className="ml-auto flex gap-6 text-center">
                <div>
                  <div className="text-xl font-bold text-indigo-700">{myStats.handled}</div>
                  <div className="text-xs text-indigo-500">conversas</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-emerald-600">{myStats.resolutionRate}%</div>
                  <div className="text-xs text-indigo-500">resolução</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-amber-600">{formatMinutes(myStats.avgResponseTime || 0)}</div>
                  <div className="text-xs text-indigo-500">tempo médio</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Overview Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={MessageSquare}
              label="Conversas abertas"
              value={overview?.totalConversations ?? 0}
              trend={overview?.trends?.conversations}
              color="bg-indigo-500"
            />
            <StatCard
              icon={CheckCircle}
              label="Resolvidas"
              value={overview?.resolvedConversations ?? 0}
              trend={overview?.trends?.resolved}
              color="bg-emerald-500"
              sub={`Taxa: ${overview?.resolutionRate ?? 0}%`}
            />
            <StatCard
              icon={Users}
              label="Novos contatos"
              value={overview?.newContacts ?? 0}
              trend={overview?.trends?.contacts}
              color="bg-purple-500"
            />
            <StatCard
              icon={Clock}
              label="Tempo médio resposta"
              value={formatMinutes(avgRT)}
              color="bg-amber-500"
            />
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Volume de Conversas</h2>
                <p className="text-xs text-gray-500 mt-0.5">Por dia no período</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => exportCSV(convByDay, `conversas-por-dia-${period}.csv`)} className="text-gray-400 hover:text-gray-600">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <Activity className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            {loading ? (
              <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />
            ) : (
              <SimpleBar data={convByDay} maxVal={maxConv} color="bg-indigo-500" labelKey="date" valueKey="total" />
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Tempo Médio de Resolução</h2>
                <p className="text-xs text-gray-500 mt-0.5">Em minutos por dia</p>
              </div>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            {loading ? (
              <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />
            ) : (
              <SimpleBar data={responseTime} maxVal={maxRT} color="bg-amber-400" labelKey="date" valueKey="avgMinutes" />
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Crescimento de Contatos</h2>
                <p className="text-xs text-gray-500 mt-0.5">Novos contatos por dia</p>
              </div>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            {loading ? (
              <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />
            ) : (
              <SimpleBar data={contactGrowth} maxVal={maxCG} color="bg-purple-500" labelKey="date" valueKey="newContacts" />
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Conversas por Canal</h2>
                <p className="text-xs text-gray-500 mt-0.5">Distribuição e taxa de resolução</p>
              </div>
              <Zap className="w-4 h-4 text-gray-400" />
            </div>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-xl" />)}
              </div>
            ) : channels.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Sem dados no período</div>
            ) : (
              <div className="space-y-3">
                {channels.map((ch) => (
                  <div key={ch.channel} className="flex items-center gap-3">
                    <ChannelBadge channel={ch.channel} />
                    <div className="flex-1">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full"
                          style={{ width: `${ch.rate}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 w-16 text-right">{ch.total} conv.</span>
                    <span className="text-xs font-semibold text-emerald-600 w-10 text-right">{ch.rate}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Performance por Agente</h2>
                <p className="text-xs text-gray-500 mt-0.5">Conversas atendidas e taxa de resolução</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => exportCSV(agents, `agentes-${period}.csv`)} className="text-gray-400 hover:text-gray-600">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <BarChart2 className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl" />)}
              </div>
            ) : agents.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Nenhum agente encontrado</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {agents.slice(0, 8).map((agent) => (
                  <AgentRow key={agent.agentId} agent={agent} max={maxAgent} />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">CSAT</h2>
                <p className="text-xs text-gray-500 mt-0.5">Satisfação do cliente</p>
              </div>
              <Star className="w-4 h-4 text-amber-400" />
            </div>
            {loading ? (
              <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
            ) : !csat || csat.total === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <Star className="w-8 h-8 text-gray-200" />
                <p className="text-sm text-gray-400">Sem avaliações no período</p>
                <p className="text-xs text-gray-300">Ative pesquisas CSAT nas configurações</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-500">{csat.average}</div>
                  <div className="text-xs text-gray-500 mt-1">{csat.total} avaliações</div>
                </div>
                <div className="space-y-2 mt-2">
                  {[5, 4, 3, 2, 1].map((score) => {
                    const item = csat.distribution?.find((d: any) => d.score === score);
                    return (
                      <div key={score} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-4">{score}</span>
                        <Star className="w-3 h-3 text-amber-400" />
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-amber-400 h-1.5 rounded-full"
                            style={{ width: `${item?.pct || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-8 text-right">{item?.count || 0}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
