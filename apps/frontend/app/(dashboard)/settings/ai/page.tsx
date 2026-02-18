'use client';
import { useState, useEffect } from 'react';
import { aiApi } from '@/lib/api';
import { Sparkles, Check, AlertCircle, ChevronDown, Zap, Brain, Cpu, Flame, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Provider {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  models: { value: string; label: string }[];
  docsUrl: string;
}

const PROVIDERS: Provider[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'GPT-4o, GPT-4o mini e GPT-3.5 Turbo',
    icon: <Brain className="w-5 h-5" />,
    color: 'from-green-500 to-teal-500',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o (Mais poderoso)' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Mais rápido)' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Econômico)' },
    ],
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    description: 'Claude 3.5 Sonnet e Claude 3 Haiku',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'from-orange-500 to-amber-500',
    models: [
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Melhor)' },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Rápido)' },
    ],
    docsUrl: 'https://console.anthropic.com/',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    description: 'Gemini 1.5 Pro e Gemini 1.5 Flash',
    icon: <Zap className="w-5 h-5" />,
    color: 'from-blue-500 to-indigo-500',
    models: [
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Melhor)' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Rápido)' },
    ],
    docsUrl: 'https://makersuite.google.com/app/apikey',
  },
  {
    id: 'groq',
    label: 'Groq',
    description: 'LLaMA 3 e Mixtral ultra-rápidos',
    icon: <Flame className="w-5 h-5" />,
    color: 'from-purple-500 to-pink-500',
    models: [
      { value: 'llama-3.3-70b-versatile', label: 'LLaMA 3.3 70B (Melhor)' },
      { value: 'llama3-8b-8192', label: 'LLaMA 3 8B (Ultra-rápido)' },
      { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
    ],
    docsUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'cohere',
    label: 'Cohere',
    description: 'Command R e Command R+',
    icon: <Leaf className="w-5 h-5" />,
    color: 'from-cyan-500 to-blue-500',
    models: [
      { value: 'command-r-plus', label: 'Command R+ (Melhor)' },
      { value: 'command-r', label: 'Command R' },
    ],
    docsUrl: 'https://dashboard.cohere.com/api-keys',
  },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', checked ? 'bg-indigo-600' : 'bg-gray-200')}>
      <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  );
}

export default function AISettingsPage() {
  const [config, setConfig] = useState({
    provider: 'openai',
    api_key: '',
    model: 'gpt-4o-mini',
    system_prompt: 'Você é um assistente de atendimento ao cliente prestativo, profissional e conciso. Responda sempre em português.',
    enabled: false,
    use_knowledge_base: true,
    include_history: true,
    max_history_messages: 10,
    auto_respond: false,
    temperature: 0.7,
    max_tokens: 1000,
    trigger_keywords: [] as string[],
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testResponse, setTestResponse] = useState('');

  useEffect(() => {
    aiApi.getConfig().then(data => {
      if (data) {
        setConfig(prev => ({
          ...prev,
          ...data,
          trigger_keywords: data.trigger_keywords ?? [],
        }));
      }
    }).catch(() => {});
  }, []);

  const selectedProvider = PROVIDERS.find(p => p.id === config.provider)!;

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      await aiApi.saveConfig(config);
      setSaveMsg({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: err.response?.data?.message || 'Falha ao salvar configurações.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestMsg(null);
    setTestResponse('');
    try {
      const saved = await aiApi.saveConfig(config);
      const result = await aiApi.test();
      if (result.ok) {
        setTestMsg({ type: 'success', text: `Conectado com sucesso! Modelo: ${result.model}` });
        setTestResponse(result.response);
      } else {
        setTestMsg({ type: 'error', text: result.response || 'Falha na conexão.' });
      }
    } catch (err: any) {
      setTestMsg({ type: 'error', text: err.response?.data?.message || 'Erro ao testar conexão.' });
    } finally {
      setTesting(false);
    }
  }

  function addKeyword() {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !config.trigger_keywords.includes(kw)) {
      setConfig({ ...config, trigger_keywords: [...config.trigger_keywords, kw] });
    }
    setKeywordInput('');
  }

  function removeKeyword(kw: string) {
    setConfig({ ...config, trigger_keywords: config.trigger_keywords.filter(k => k !== kw) });
  }

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Inteligência Artificial</h1>
            </div>
            <p className="text-sm text-gray-500">Configure um assistente de IA para sugerir respostas usando sua base de conhecimento</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">IA Ativa</span>
            <Toggle checked={config.enabled} onChange={v => setConfig({ ...config, enabled: v })} />
          </div>
        </div>

        {/* Provider Selection */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Provider de IA</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {PROVIDERS.map(p => (
              <button key={p.id} onClick={() => setConfig({ ...config, provider: p.id, model: p.models[0].value })}
                className={cn('text-left p-4 rounded-2xl border-2 transition-all relative', config.provider === p.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white')}>
                {config.provider === p.id && (
                  <span className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Ativo</span>
                )}
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-2', p.color)}>
                  {p.icon}
                </div>
                <div className="font-semibold text-gray-900 text-sm">{p.label}</div>
                <div className="text-xs text-gray-400 mt-0.5 leading-tight">{p.description}</div>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 flex items-center justify-between">
                API Key do {selectedProvider.label}
                <a href={selectedProvider.docsUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-normal">Como obter →</a>
              </label>
              <input
                type="password"
                value={config.api_key}
                onChange={e => setConfig({ ...config, api_key: e.target.value })}
                placeholder="sk-..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Modelo</label>
              <div className="relative">
                <select
                  value={config.model}
                  onChange={e => setConfig({ ...config, model: e.target.value })}
                  className="w-full appearance-none px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white pr-10"
                >
                  {selectedProvider.models.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Comportamento */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-700">Comportamento</h2>
          {[
            { key: 'auto_respond', label: 'Responder automaticamente', desc: 'A IA responde sem intervenção do atendente' },
            { key: 'use_knowledge_base', label: 'Usar Base de Conhecimento como contexto', desc: 'Busca artigos relevantes para enriquecer as respostas' },
            { key: 'include_history', label: 'Incluir histórico da conversa', desc: 'Envia as últimas mensagens como contexto para a IA' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <Toggle checked={config[item.key as keyof typeof config] as boolean} onChange={v => setConfig({ ...config, [item.key]: v })} />
            </div>
          ))}
          {config.include_history && (
            <div className="space-y-1 pt-1">
              <label className="text-xs font-semibold text-gray-600 flex items-center justify-between">
                <span>Máximo de mensagens de contexto</span>
                <span className="text-indigo-600 font-bold">{config.max_history_messages}</span>
              </label>
              <input type="range" min="3" max="30" step="1" value={config.max_history_messages} onChange={e => setConfig({ ...config, max_history_messages: parseInt(e.target.value) })} className="w-full accent-indigo-600" />
              <div className="flex justify-between text-xs text-gray-400">
                <span>3 msgs</span>
                <span>30 msgs</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 flex items-center justify-between">
              <span>Criatividade (Temperatura)</span>
              <span className="text-indigo-600 font-bold">{config.temperature.toFixed(1)}</span>
            </label>
            <input type="range" min="0" max="1" step="0.1" value={config.temperature} onChange={e => setConfig({ ...config, temperature: parseFloat(e.target.value) })} className="w-full accent-indigo-600" />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Preciso</span>
              <span>Criativo</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Máximo de tokens por resposta</label>
            <input type="number" min="100" max="4000" step="100" value={config.max_tokens} onChange={e => setConfig({ ...config, max_tokens: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Prompt do sistema</label>
            <textarea rows={4} value={config.system_prompt} onChange={e => setConfig({ ...config, system_prompt: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm resize-none" />
          </div>
        </div>

        {/* Gatilhos */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-1">Palavras-chave Gatilho</h2>
          <p className="text-xs text-gray-400 mb-4">Quando uma mensagem contiver estas palavras, a IA será acionada automaticamente</p>
          <div className="flex gap-2 mb-3">
            <input
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addKeyword()}
              placeholder="Digite uma palavra e pressione Enter..."
              className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
            <button onClick={addKeyword} className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-2xl hover:bg-indigo-700 transition">Adicionar</button>
          </div>
          {config.trigger_keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.trigger_keywords.map(kw => (
                <span key={kw} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold">
                  {kw}
                  <button onClick={() => removeKeyword(kw)} className="hover:text-red-500 transition leading-none">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Teste */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Testar Conexão</h2>
          <button onClick={handleTest} disabled={testing || !config.api_key}
            className="w-full py-3 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-2xl text-sm font-semibold hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {testing ? 'Testando...' : `Testar conexão com ${selectedProvider.label}`}
          </button>
          {testMsg && (
            <div className={cn('flex items-center gap-2 mt-3 text-sm font-semibold', testMsg.type === 'success' ? 'text-green-600' : 'text-red-600')}>
              {testMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {testMsg.text}
            </div>
          )}
          {testResponse && (
            <div className="mt-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-1">Resposta da IA:</p>
              <p className="text-sm text-gray-700">{testResponse}</p>
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex items-center justify-between pb-8">
          {saveMsg && (
            <div className={cn('flex items-center gap-2 text-sm font-semibold', saveMsg.type === 'success' ? 'text-green-600' : 'text-red-600')}>
              {saveMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {saveMsg.text}
            </div>
          )}
          <button onClick={handleSave} disabled={saving}
            className="ml-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}
