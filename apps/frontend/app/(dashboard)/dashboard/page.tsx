'use client';
import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import Link from 'next/link';
import { MessageSquare, Clock, Inbox, Users, CheckCircle, AlertTriangle, TrendingUp, BookOpen, Bot, Zap } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface Conversation {
  id: string;
  contact?: { full_name?: string; email?: string };
  last_message_at: string;
  last_message_preview?: string;
}

interface Metrics {
  openToday: number;
  totalOpen: number;
  unassigned: number;
  resolvedToday: number;
  totalContacts: number;
  totalMessages: number;
  noResponseLong: Conversation[];
  onlineAgents: number;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: number | string;
  icon: any;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{label}</span>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.metrics()
      .then(setMetrics)
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      dashboardApi.metrics().then(setMetrics);
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const noResp = metrics?.noResponseLong || [];

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Painel de Controle</h1>
          <p className="text-gray-500 mt-1">Visão analítica do seu ecossistema de atendimento</p>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Abertas hoje" value={metrics?.openToday || 0} icon={MessageSquare} color="bg-indigo-100 text-indigo-600" sub="novas conversas" />
          <MetricCard label="Total em aberto" value={metrics?.totalOpen || 0} icon={Inbox} color="bg-blue-100 text-blue-600" sub="aguardando" />
          <MetricCard label="Resolvidas hoje" value={metrics?.resolvedToday || 0} icon={CheckCircle} color="bg-green-100 text-green-600" sub="finalizadas" />
          <MetricCard label="Sem responsável" value={metrics?.unassigned || 0} icon={Clock} color="bg-orange-100 text-orange-600" sub="precisam atenção" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Total contatos" value={metrics?.totalContacts || 0} icon={Users} color="bg-purple-100 text-purple-600" />
          <MetricCard label="Mensagens hoje" value={metrics?.totalMessages || 0} icon={TrendingUp} color="bg-pink-100 text-pink-600" />
          <MetricCard label="Agentes online" value={metrics?.onlineAgents || 0} icon={Users} color="bg-emerald-100 text-emerald-600" sub="ativos agora" />
          <MetricCard
            label="Taxa resolução"
            value={metrics?.openToday ? `${Math.round((metrics.resolvedToday / (metrics.openToday + metrics.resolvedToday)) * 100)}%` : '0%'}
            icon={CheckCircle}
            color="bg-teal-100 text-teal-600"
            sub="hoje"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-gray-900">Volume de Interações</h3>
              <select className="bg-gray-50 border-none text-xs font-semibold text-gray-400 rounded-lg px-3 py-1.5 focus:ring-0">
                <option>Últimos 7 dias</option>
              </select>
            </div>
            <div className="h-48 flex items-end gap-3 px-2">
              {[35, 45, 30, 60, 85, 40, 55].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full bg-indigo-50 rounded-t-xl group-hover:bg-indigo-100 transition-colors flex items-end justify-center" style={{ height: `${h}%` }}>
                    <div className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-xl opacity-80 group-hover:opacity-100 transition-opacity" style={{ height: '100%' }} />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-bold">
                      {h * 4} msgs
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
              <h3 className="text-white/80 text-sm font-medium mb-1">Status da Plataforma</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                <span className="font-bold tracking-tight">Sistema Online</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Agentes</p>
                  <p className="text-2xl font-black">{metrics?.onlineAgents || 0}</p>
                </div>
                <div>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Fila</p>
                  <p className="text-2xl font-black">{metrics?.unassigned || 0}</p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-2">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Acesso Rápido</h3>
              <Link href="/knowledge-base" className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-indigo-50 transition group">
                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Base de Conhecimento</span>
              </Link>
              <Link href="/settings/bot" className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-indigo-50 transition group">
                <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Bot & Automações</span>
              </Link>
              <Link href="/settings/quick-replies" className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-indigo-50 transition group">
                <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Respostas Rápidas</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Conversations without response */}
        {noResp.length > 0 && (
          <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-orange-900">Conversas sem resposta há mais de 30 minutos</h3>
              <span className="ml-auto bg-orange-100 text-orange-600 text-xs font-bold px-2.5 py-1 rounded-full">{noResp.length}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {noResp.map(conv => (
                <Link key={conv.id} href={`/inbox?conv=${conv.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                    {(conv.contact?.full_name || 'V').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{conv.contact?.full_name || conv.contact?.email || 'Visitante'}</p>
                    <p className="text-xs text-gray-400 truncate">{conv.last_message_preview || 'Sem mensagem'}</p>
                  </div>
                  <span className="text-xs text-orange-500 font-medium shrink-0">{timeAgo(conv.last_message_at)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
