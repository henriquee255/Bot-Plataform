'use client';
import { useEffect, useState, useRef } from 'react';
import { adminApi } from '@/lib/api';
import { Palette, Save, RefreshCw, Image, Type, Link2, CheckCircle, Upload } from 'lucide-react';

export default function PlatformPage() {
  const [settings, setSettings] = useState({
    platform_name: '',
    platform_tagline: '',
    platform_logo_url: '',
    platform_favicon_url: '',
    platform_primary_color: '#4f46e5',
    platform_support_email: '',
    platform_website: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  function handleImageUpload(field: 'platform_logo_url' | 'platform_favicon_url', file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSettings(prev => ({ ...prev, [field]: dataUrl }));
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    adminApi.getPlatformSettings().then((data: any) => {
      if (data) setSettings(prev => ({ ...prev, ...data }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await adminApi.updatePlatformSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { }
    setSaving(false);
  }

  function Field({ label, field, type = 'text', placeholder, hint }: { label: string; field: keyof typeof settings; type?: string; placeholder?: string; hint?: string }) {
    return (
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
        {hint && <p className="text-xs text-slate-600 mt-0.5 mb-1">{hint}</p>}
        <input
          type={type}
          value={settings[field]}
          onChange={e => setSettings(prev => ({ ...prev, [field]: e.target.value }))}
          placeholder={placeholder}
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
        />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Identidade da Plataforma</h1>
          <p className="text-slate-400 text-sm mt-1">Nome, logo, favicon e identidade visual global</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-slate-800 rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Identidade */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-400" />
              Nome e Texto
            </h2>
            <div className="space-y-4">
              <Field label="Nome da Plataforma" field="platform_name" placeholder="ChatPlatform" hint="Aparece na sidebar e no cabeçalho" />
              <Field label="Tagline / Slogan" field="platform_tagline" placeholder="Atendimento inteligente em tempo real" />
              <Field label="E-mail de Suporte" field="platform_support_email" placeholder="suporte@suaplatforma.com" type="email" />
              <Field label="Website Oficial" field="platform_website" placeholder="https://suaplatforma.com" />
            </div>
          </div>

          {/* Logos */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Image className="w-4 h-4 text-purple-400" />
              Logo e Favicon
            </h2>
            <div className="space-y-4">
              {/* Logo */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logo da Plataforma</label>
                <p className="text-xs text-slate-600 mt-0.5 mb-2">Imagem quadrada (PNG/SVG, 128×128px). Aparece na sidebar de todas as empresas.</p>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={settings.platform_logo_url.startsWith('data:') ? '(imagem carregada do dispositivo)' : settings.platform_logo_url}
                      onChange={e => setSettings(prev => ({ ...prev, platform_logo_url: e.target.value }))}
                      placeholder="https://seusite.com/logo.png"
                      readOnly={settings.platform_logo_url.startsWith('data:')}
                      className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                    />
                  </div>
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-xs font-bold text-slate-300 transition"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload
                  </button>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload('platform_logo_url', f); }} />
                </div>
                {settings.platform_logo_url && (
                  <div className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-xl mt-2">
                    <img src={settings.platform_logo_url} alt="Preview" className="w-10 h-10 rounded-xl object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                    <span className="text-xs text-slate-400">Preview do logo</span>
                    {settings.platform_logo_url.startsWith('data:') && (
                      <span className="ml-auto text-[10px] text-emerald-400 font-bold">Imagem local ✓</span>
                    )}
                  </div>
                )}
              </div>

              {/* Favicon */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Favicon</label>
                <p className="text-xs text-slate-600 mt-0.5 mb-2">Ícone que aparece na aba do navegador (ICO/PNG 32×32px)</p>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={settings.platform_favicon_url.startsWith('data:') ? '(imagem carregada do dispositivo)' : settings.platform_favicon_url}
                      onChange={e => setSettings(prev => ({ ...prev, platform_favicon_url: e.target.value }))}
                      placeholder="https://seusite.com/favicon.ico"
                      readOnly={settings.platform_favicon_url.startsWith('data:')}
                      className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                    />
                  </div>
                  <button
                    onClick={() => faviconInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-xs font-bold text-slate-300 transition"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload
                  </button>
                  <input ref={faviconInputRef} type="file" accept="image/*,.ico" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload('platform_favicon_url', f); }} />
                </div>
              </div>
            </div>
          </div>

          {/* Cor primária */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              Cor Primária
            </h2>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={settings.platform_primary_color}
                onChange={e => setSettings(prev => ({ ...prev, platform_primary_color: e.target.value }))}
                className="w-12 h-12 rounded-xl border-0 cursor-pointer bg-transparent"
              />
              <div>
                <div className="text-sm font-bold text-white">{settings.platform_primary_color}</div>
                <div className="text-xs text-slate-500 mt-0.5">Cor usada em botões e destaques</div>
              </div>
              <div className="ml-auto w-16 h-10 rounded-xl" style={{ backgroundColor: settings.platform_primary_color }} />
            </div>
          </div>

          <div className="text-xs text-slate-600 text-center">
            Algumas alterações como favicon requerem F5 para recarregar o navegador
          </div>
        </div>
      )}
    </div>
  );
}
