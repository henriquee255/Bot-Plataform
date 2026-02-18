'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { usersApi, scheduleApi } from '@/lib/api';
import { api } from '@/lib/api';
import {
  UserCircle, Mail, Lock, Camera, Check, AlertCircle,
  Bell, Clock, Shield, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'profile' | 'security' | 'notifications' | 'schedule';

interface DaySchedule { enabled: boolean; start: string; end: string; }
interface WeekSchedule { [key: string]: DaySchedule; }

const DAYS = [
  { key: 'mon', label: 'Segunda' },
  { key: 'tue', label: 'Terça' },
  { key: 'wed', label: 'Quarta' },
  { key: 'thu', label: 'Quinta' },
  { key: 'fri', label: 'Sexta' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (UTC-3)' },
  { value: 'America/Manaus', label: 'Manaus (UTC-4)' },
  { value: 'America/Belem', label: 'Belém (UTC-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (UTC-3)' },
  { value: 'America/Recife', label: 'Recife (UTC-3)' },
  { value: 'America/Cuiaba', label: 'Cuiabá (UTC-4)' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (UTC-4)' },
  { value: 'America/Boa_Vista', label: 'Boa Vista (UTC-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (UTC-5)' },
];

const DEFAULT_SCHEDULE: WeekSchedule = {
  mon: { enabled: true, start: '09:00', end: '18:00' },
  tue: { enabled: true, start: '09:00', end: '18:00' },
  wed: { enabled: true, start: '09:00', end: '18:00' },
  thu: { enabled: true, start: '09:00', end: '18:00' },
  fri: { enabled: true, start: '09:00', end: '18:00' },
  sat: { enabled: false, start: '09:00', end: '13:00' },
  sun: { enabled: false, start: '09:00', end: '13:00' },
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none', checked ? 'bg-indigo-600' : 'bg-gray-200')}
    >
      <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  );
}

export function ScheduleEditor({ schedule, onChange, timezone, onTimezoneChange, enabled, onEnabledChange }: {
  schedule: WeekSchedule; onChange: (s: WeekSchedule) => void;
  timezone: string; onTimezoneChange: (tz: string) => void;
  enabled: boolean; onEnabledChange: (v: boolean) => void;
}) {
  function updateDay(key: string, field: keyof DaySchedule, value: any) {
    onChange({ ...schedule, [key]: { ...schedule[key], [field]: value } });
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
        <div>
          <p className="font-semibold text-gray-900 text-sm">Controle de disponibilidade</p>
          <p className="text-xs text-gray-500 mt-0.5">Defina quando você está disponível para atendimento</p>
        </div>
        <Toggle checked={enabled} onChange={onEnabledChange} />
      </div>
      {enabled && (
        <>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 ml-1">Fuso Horário</label>
            <div className="relative">
              <select
                value={timezone}
                onChange={e => onTimezoneChange(e.target.value)}
                className="w-full appearance-none px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white pr-10"
              >
                {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 ml-1">Horário por dia</label>
            {DAYS.map(day => {
              const d = schedule[day.key] || { enabled: false, start: '09:00', end: '18:00' };
              return (
                <div key={day.key} className={cn('flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors', d.enabled ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-100 bg-gray-50/30')}>
                  <Toggle checked={d.enabled} onChange={v => updateDay(day.key, 'enabled', v)} />
                  <span className={cn('text-sm font-semibold w-20', d.enabled ? 'text-gray-900' : 'text-gray-400')}>{day.label}</span>
                  {d.enabled ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={d.start} onChange={e => updateDay(day.key, 'start', e.target.value)} className="px-3 py-1.5 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white" />
                      <span className="text-gray-400 text-xs font-medium">até</span>
                      <input type="time" value={d.end} onChange={e => updateDay(day.key, 'end', e.target.value)} className="px-3 py-1.5 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white" />
                    </div>
                  ) : <span className="text-xs text-gray-400 italic flex-1">Folga</span>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Feedback({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) {
  if (!msg) return null;
  return (
    <div className={cn('flex items-center gap-2 text-sm font-semibold', msg.type === 'success' ? 'text-green-600' : 'text-red-600')}>
      {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg.text}
    </div>
  );
}

export default function ProfileSettingsPage() {
  const { user, setUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profileData, setProfileData] = useState({ full_name: user?.fullName || '', email: user?.email || '', phone: '', bio: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [secLoading, setSecLoading] = useState(false);
  const [secMsg, setSecMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notif, setNotif] = useState({ newConversation: true, unreadMessage: true, sounds: true, email: false });
  const [notifSaved, setNotifSaved] = useState(false);
  const [schedEnabled, setSchedEnabled] = useState(false);
  const [schedTimezone, setSchedTimezone] = useState('America/Sao_Paulo');
  const [schedWeek, setSchedWeek] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedMsg, setSchedMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notif-prefs');
      if (saved) setNotif(JSON.parse(saved));
    }
    scheduleApi.getMySchedule().then(data => {
      if (data?.work_schedule) {
        setSchedEnabled(data.work_schedule.enabled ?? false);
        setSchedTimezone(data.work_schedule.timezone ?? 'America/Sao_Paulo');
        if (data.work_schedule.shifts) {
          const week: WeekSchedule = { ...DEFAULT_SCHEDULE };
          data.work_schedule.shifts.forEach((s: any) => {
            week[s.day] = { enabled: s.active, start: s.start, end: s.end };
          });
          setSchedWeek(week);
        }
      }
    }).catch(() => {});
  }, []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const updated = await usersApi.updateProfile(profileData);
      setUser({ ...user!, fullName: updated.full_name ?? profileData.full_name });
      setProfileMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Falha ao atualizar perfil.' });
    } finally {
      setProfileLoading(false);
      setTimeout(() => setProfileMsg(null), 3000);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) { setSecMsg({ type: 'error', text: 'As senhas não coincidem.' }); return; }
    if (passwords.new.length < 6) { setSecMsg({ type: 'error', text: 'A nova senha deve ter ao menos 6 caracteres.' }); return; }
    setSecLoading(true);
    setSecMsg(null);
    try {
      await api.post('/users/me/change-password', { currentPassword: passwords.current, newPassword: passwords.new });
      setPasswords({ current: '', new: '', confirm: '' });
      setSecMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
    } catch (err: any) {
      setSecMsg({ type: 'error', text: err.response?.data?.message || 'Senha atual incorreta.' });
    } finally {
      setSecLoading(false);
      setTimeout(() => setSecMsg(null), 4000);
    }
  }

  function handleSaveNotifications() {
    localStorage.setItem('notif-prefs', JSON.stringify(notif));
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2500);
  }

  async function handleSaveSchedule() {
    setSchedLoading(true);
    setSchedMsg(null);
    try {
      const shifts = DAYS.map(d => ({ day: d.key, start: schedWeek[d.key]?.start || '09:00', end: schedWeek[d.key]?.end || '18:00', active: schedWeek[d.key]?.enabled ?? false }));
      await scheduleApi.saveMySchedule({ enabled: schedEnabled, timezone: schedTimezone, shifts });
      setSchedMsg({ type: 'success', text: 'Escala salva com sucesso!' });
    } catch (err: any) {
      setSchedMsg({ type: 'error', text: err.response?.data?.message || 'Falha ao salvar escala.' });
    } finally {
      setSchedLoading(false);
      setTimeout(() => setSchedMsg(null), 3000);
    }
  }

  const TABS = [
    { id: 'profile' as Tab, label: 'Meu Perfil', icon: UserCircle },
    { id: 'security' as Tab, label: 'Segurança', icon: Shield },
    { id: 'notifications' as Tab, label: 'Notificações', icon: Bell },
    { id: 'schedule' as Tab, label: 'Minha Escala', icon: Clock },
  ];

  const MOCK_SESSIONS = [
    { id: '1', device: 'Chrome · Windows 11', location: 'São Paulo, BR', current: true, lastSeen: 'Agora' },
    { id: '2', device: 'Safari · iPhone 15', location: 'São Paulo, BR', current: false, lastSeen: 'Há 2 horas' },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-sm text-gray-500">Gerencie suas informações pessoais e preferências</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px', activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: Meu Perfil */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 mb-4">Foto de Perfil</h2>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold overflow-hidden border-2 border-indigo-200">
                    {avatarPreview ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" /> : <span>{user?.fullName?.[0]?.toUpperCase()}</span>}
                  </div>
                  <button type="button" onClick={() => fileRef.current?.click()} className="absolute -bottom-2 -right-2 p-1.5 bg-white rounded-xl shadow-md border border-gray-200 text-gray-500 hover:text-indigo-600 transition">
                    <Camera className="w-4 h-4" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">{user?.fullName}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                  {avatarFile && <p className="text-xs text-indigo-600 mt-1">Foto selecionada — salve o perfil para confirmar</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 mb-5">Informações Pessoais</h2>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Nome completo</label>
                    <input type="text" required value={profileData.full_name} onChange={e => setProfileData({ ...profileData, full_name: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" readOnly value={profileData.email} className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm text-gray-500 cursor-not-allowed" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Telefone <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <input type="tel" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} placeholder="+55 11 99999-9999" className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Cargo / Função</label>
                    <input type="text" value={profileData.bio} onChange={e => setProfileData({ ...profileData, bio: e.target.value })} placeholder="Ex: Atendente, Supervisor..." className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <Feedback msg={profileMsg} />
                  <button type="submit" disabled={profileLoading} className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-md shadow-indigo-100">
                    {profileLoading ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB: Segurança */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 mb-5 flex items-center gap-2"><Lock className="w-4 h-4 text-indigo-600" />Alterar Senha</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Senha atual</label>
                  <input type="password" required value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} placeholder="••••••••" className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Nova senha</label>
                    <input type="password" required value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} placeholder="••••••••" className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Confirmar nova senha</label>
                    <input type="password" required value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="••••••••" className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <Feedback msg={secMsg} />
                  <button type="submit" disabled={secLoading} className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-md shadow-indigo-100">
                    {secLoading ? 'Alterando...' : 'Alterar senha'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-indigo-600" />Sessões Ativas</h2>
              <div className="space-y-3">
                {MOCK_SESSIONS.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{s.device}</p>
                      <p className="text-xs text-gray-400">{s.location} · {s.lastSeen}</p>
                    </div>
                    {s.current ? <span className="text-[10px] px-2.5 py-1 bg-green-100 text-green-700 rounded-lg font-bold uppercase tracking-wider">Atual</span> : <button className="text-xs text-red-500 hover:text-red-700 font-semibold transition">Encerrar</button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Notificações */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 mb-5 flex items-center gap-2"><Bell className="w-4 h-4 text-indigo-600" />Preferências de Notificação</h2>
            {[
              { key: 'newConversation', label: 'Nova conversa', desc: 'Notificar quando uma nova conversa for iniciada' },
              { key: 'unreadMessage', label: 'Mensagem não lida', desc: 'Notificar quando houver mensagens não lidas' },
              { key: 'sounds', label: 'Sons de notificação', desc: 'Reproduzir sons ao receber notificações' },
              { key: 'email', label: 'Notificações por e-mail', desc: 'Receber resumos e alertas por e-mail' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
                <Toggle checked={notif[item.key as keyof typeof notif]} onChange={v => setNotif({ ...notif, [item.key]: v })} />
              </div>
            ))}
            <div className="pt-4 flex items-center justify-between">
              {notifSaved && <span className="flex items-center gap-1.5 text-green-600 text-sm font-semibold"><Check className="w-4 h-4" /> Salvo!</span>}
              <button onClick={handleSaveNotifications} className="ml-auto px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition shadow-md shadow-indigo-100">
                Salvar preferências
              </button>
            </div>
          </div>
        )}

        {/* TAB: Minha Escala */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 mb-5 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-600" />Minha Escala de Atendimento</h2>
            <ScheduleEditor schedule={schedWeek} onChange={setSchedWeek} timezone={schedTimezone} onTimezoneChange={setSchedTimezone} enabled={schedEnabled} onEnabledChange={setSchedEnabled} />
            <div className="flex items-center justify-between pt-6 mt-4 border-t border-gray-100">
              <Feedback msg={schedMsg} />
              <button onClick={handleSaveSchedule} disabled={schedLoading} className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-md shadow-indigo-100">
                {schedLoading ? 'Salvando...' : 'Salvar escala'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
