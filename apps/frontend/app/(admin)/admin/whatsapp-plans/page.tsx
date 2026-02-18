'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Smartphone, Save, RefreshCw, CheckCircle, Info } from 'lucide-react';

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuito',
  monthly: 'Mensal',
  annual: 'Anual',
  lifetime: 'Vitalício',
};

const PLAN_COLORS: Record<string, string> = {
  free: 'border-gray-600',
  monthly: 'border-blue-500',
  annual: 'border-indigo-500',
  lifetime: 'border-orange-500',
};

export default function WhatsAppPlansPage() {
  const [plans, setPlans] = useState<any>({
    free: { maxNumbers: 0, messagesPerMonth: 0, allowQR: false },
    monthly: { maxNumbers: 1, messagesPerMonth: 1000, allowQR: true },
    annual: { maxNumbers: 3, messagesPerMonth: 5000, allowQR: true },
    lifetime: { maxNumbers: 10, messagesPerMonth: -1, allowQR: true },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminApi.getWhatsAppPlans().then((data: any) => {
      if (data) setPlans(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await adminApi.updateWhatsAppPlans(plans);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { }
    setSaving(false);
  }

  function update(plan: string, field: string, value: any) {
    setPlans((prev: any) => ({ ...prev, [plan]: { ...prev[plan], [field]: value } }));
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">WhatsApp por Plano</h1>
          <p className="text-slate-400 text-sm mt-1">Configure limites de números e mensagens WhatsApp por tipo de plano</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-400">
          <strong className="text-slate-300">Mensagens ilimitadas:</strong> Digite <code className="bg-slate-700 px-1 rounded">-1</code> no campo de mensagens para permitir uso sem limite.
          Os limites são verificados pelo backend ao tentar enviar mensagens via WhatsApp.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-slate-800 rounded-2xl h-48 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(plans).map(([planKey, planConfig]: [string, any]) => (
            <div key={planKey} className={`bg-slate-800 rounded-2xl p-6 border-2 ${PLAN_COLORS[planKey] || 'border-slate-700'}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{PLAN_LABELS[planKey] || planKey}</h3>
                  <p className="text-xs text-slate-500">Plano {planKey}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Números de WhatsApp
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={planConfig.maxNumbers}
                    onChange={e => update(planKey, 'maxNumbers', Number(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-slate-600 mt-1">Máximo de números conectados simultaneamente</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Mensagens / Mês
                  </label>
                  <input
                    type="number"
                    min={-1}
                    value={planConfig.messagesPerMonth}
                    onChange={e => update(planKey, 'messagesPerMonth', Number(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-slate-600 mt-1">-1 = ilimitado</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                  <div>
                    <div className="text-sm font-bold text-slate-300">Permitir QR Code</div>
                    <div className="text-xs text-slate-500">Conexão via QR Code (Baileys)</div>
                  </div>
                  <button
                    onClick={() => update(planKey, 'allowQR', !planConfig.allowQR)}
                    className={`w-12 h-6 rounded-full transition-all relative ${planConfig.allowQR ? 'bg-emerald-500' : 'bg-slate-600'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${planConfig.allowQR ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
