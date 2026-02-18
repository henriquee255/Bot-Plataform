'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { Server, Cpu, HardDrive, Database, Clock, RefreshCw, CheckCircle, AlertTriangle, Wifi } from 'lucide-react';

function ProgressBar({ value, color = 'bg-emerald-500' }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-slate-700 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

export default function SystemPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await adminApi.getSystemHealth();
      setHealth(h);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // auto refresh every 15s
    return () => clearInterval(interval);
  }, [load]);

  const memUsedPct = health?.memory?.usedPct || 0;
  const heapPct = health ? Math.round((health.memory.heap / health.memory.total) * 100) : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Sistema & Saúde</h1>
          <p className="text-slate-400 text-sm mt-1">Monitoramento em tempo real da plataforma</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {loading && !health ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-slate-800 rounded-2xl h-32 animate-pulse" />)}
        </div>
      ) : health ? (
        <>
          {/* Status principal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-3 h-3 rounded-full ${health.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-sm font-bold text-slate-300">Status</span>
              </div>
              <div className={`text-xl font-black ${health.status === 'healthy' ? 'text-emerald-400' : 'text-red-400'}`}>
                {health.status === 'healthy' ? 'Operacional' : 'Degradado'}
              </div>
              <div className="text-xs text-slate-500 mt-1">Todos os sistemas</div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-slate-300">Uptime</span>
              </div>
              <div className="text-xl font-black text-white">{health.uptimeHuman}</div>
              <div className="text-xs text-slate-500 mt-1">{health.uptime}s total</div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Database className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-slate-300">Banco de Dados</span>
              </div>
              <div className="text-xl font-black text-emerald-400">Conectado</div>
              <div className="text-xs text-slate-500 mt-1">
                {health.database.totalCompanies} empresas · {health.database.totalUsers} usuários
              </div>
            </div>
          </div>

          {/* Memória */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-slate-300">Memória do Sistema</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${memUsedPct > 80 ? 'bg-red-900/40 text-red-400' : 'bg-emerald-900/40 text-emerald-400'}`}>
                  {memUsedPct}%
                </span>
              </div>
              <ProgressBar value={memUsedPct} color={memUsedPct > 80 ? 'bg-red-500' : 'bg-amber-400'} />
              <div className="text-xs text-slate-500 mt-2">
                {health.memory.totalSystem - health.memory.freeSystem}MB usado de {health.memory.totalSystem}MB
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-slate-300">Node.js Heap</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-400">
                  {heapPct}%
                </span>
              </div>
              <ProgressBar value={heapPct} color="bg-indigo-500" />
              <div className="text-xs text-slate-500 mt-2">
                {health.memory.heap}MB heap · {health.memory.used}MB RSS total
              </div>
            </div>
          </div>

          {/* Info técnica */}
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <h2 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Informações Técnicas
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Node.js', value: health.node.version },
                { label: 'Plataforma', value: health.node.platform },
                { label: 'CPU Cores', value: health.cpu.cores },
                { label: 'Última verificação', value: new Date(health.timestamp).toLocaleTimeString('pt-BR') },
              ].map((item) => (
                <div key={item.label} className="bg-slate-700/50 rounded-xl p-3">
                  <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                  <div className="text-sm font-bold text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-slate-600">Atualização automática a cada 15 segundos</div>
        </>
      ) : (
        <div className="text-center text-slate-500 py-20">Erro ao carregar dados do sistema</div>
      )}
    </div>
  );
}
