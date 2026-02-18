'use client';
import { useEffect, useState } from 'react';
import { usersApi, scheduleApi } from '@/lib/api';
import { getInitials, cn } from '@/lib/utils';
import { UserPlus, Mail, Clock, X, CheckCircle, ChevronRight, RefreshCw, Shield } from 'lucide-react';

interface Agent {
  id: string;
  email: string;
  full_name: string;
  role: string;
  last_seen_at: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador', manager: 'Gerente', supervisor: 'Supervisor', agent: 'Atendente',
};
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-50 text-red-700 border-red-100',
  manager: 'bg-purple-50 text-purple-700 border-purple-100',
  supervisor: 'bg-blue-50 text-blue-700 border-blue-100',
  agent: 'bg-gray-50 text-gray-600 border-gray-100',
};

const DAYS = [
  { key: 'mon', label: 'Segunda' }, { key: 'tue', label: 'Terça' },
  { key: 'wed', label: 'Quarta' }, { key: 'thu', label: 'Quinta' },
  { key: 'fri', label: 'Sexta' }, { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

const DEFAULT_SCHEDULE = {
  mon: { enabled: true, start: '09:00', end: '18:00' },
  tue: { enabled: true, start: '09:00', end: '18:00' },
  wed: { enabled: true, start: '09:00', end: '18:00' },
  thu: { enabled: true, start: '09:00', end: '18:00' },
  fri: { enabled: true, start: '09:00', end: '18:00' },
  sat: { enabled: false, start: '09:00', end: '13:00' },
  sun: { enabled: false, start: '09:00', end: '13:00' },
};

// ---- Permissions config ----
const RESOURCES: { key: string; label: string; actions: string[] }[] = [
  { key: 'inbox',          label: 'Inbox',            actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'reports',        label: 'Relatórios',       actions: ['view', 'edit'] },
  { key: 'knowledge_base', label: 'Base de Conhecimento', actions: ['view', 'edit'] },
  { key: 'automations',    label: 'Automações',       actions: ['view', 'edit'] },
  { key: 'bots',           label: 'Bots',             actions: ['view', 'edit'] },
  { key: 'channels',       label: 'Canais',           actions: ['view', 'edit'] },
  { key: 'team',           label: 'Equipe',           actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'sectors',        label: 'Setores',          actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'settings',       label: 'Configurações',    actions: ['view', 'edit'] },
  { key: 'crm',            label: 'CRM',              actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'dashboard',      label: 'Dashboard',        actions: ['view'] },
];

const ACTION_LABELS: Record<string, string> = {
  view: 'Ver', create: 'Criar', edit: 'Editar', delete: 'Deletar',
};

type PermissionMap = Record<string, Set<string>>;

function getToken(): string {
  try {
    return JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.accessToken || '';
  } catch { return ''; }
}

const API_BASE = 'http://localhost:3001/api';

function PermissionsModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [perms, setPerms] = useState<PermissionMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/users/${agent.id}/permissions`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data: { resource: string; actions: string[] }[] = await res.json();
          const map: PermissionMap = {};
          for (const p of data) map[p.resource] = new Set(p.actions);
          setPerms(map);
        }
      } catch { }
      setLoading(false);
    }
    load();
  }, [agent.id]);

  function toggleAction(resource: string, action: string) {
    setPerms(prev => {
      const next = { ...prev };
      const set = new Set(next[resource] || []);
      if (set.has(action)) set.delete(action);
      else set.add(action);
      next[resource] = set;
      return next;
    });
  }

  function toggleResource(resource: string, actions: string[]) {
    setPerms(prev => {
      const next = { ...prev };
      const currentSet = next[resource] || new Set<string>();
      const hasAll = actions.every(a => currentSet.has(a));
      if (hasAll) {
        next[resource] = new Set<string>();
      } else {
        next[resource] = new Set(actions);
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const permissions = RESOURCES
        .map(r => ({
          resource: r.key,
          actions: Array.from(perms[r.key] || []).filter(a => r.actions.includes(a)),
        }))
        .filter(p => p.actions.length > 0);

      const res = await fetch(`${API_BASE}/users/${agent.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ permissions }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => { setSaved(false); onClose(); }, 1500);
      }
    } catch { }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Permissoes de {agent.full_name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Defina o que este usuario pode acessar</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">Carregando...</div>
          ) : (
            <div className="space-y-2">
              {/* Column headers */}
              <div className="flex items-center gap-2 px-3 pb-1">
                <div className="w-5" />
                <div className="flex-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recurso</div>
                <div className="flex gap-2">
                  {['view', 'create', 'edit', 'delete'].map(a => (
                    <div key={a} className="w-14 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {ACTION_LABELS[a]}
                    </div>
                  ))}
                </div>
              </div>

              {RESOURCES.map(r => {
                const currentSet = perms[r.key] || new Set<string>();
                const hasAny = r.actions.some(a => currentSet.has(a));
                const hasAll = r.actions.every(a => currentSet.has(a));

                return (
                  <div
                    key={r.key}
                    className={cn(
                      'flex items-center gap-2 px-3 py-3 rounded-xl border transition-colors',
                      hasAny ? 'border-indigo-200 bg-indigo-50/40' : 'border-gray-100 bg-gray-50/30',
                    )}
                  >
                    {/* Resource toggle checkbox */}
                    <button
                      onClick={() => toggleResource(r.key, r.actions)}
                      className={cn(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                        hasAll
                          ? 'bg-indigo-600 border-indigo-600'
                          : hasAny
                          ? 'bg-indigo-200 border-indigo-400'
                          : 'bg-white border-gray-300',
                      )}
                    >
                      {(hasAll || hasAny) && <CheckCircle className="w-3 h-3 text-white" />}
                    </button>

                    <span className={cn('flex-1 text-sm font-semibold', hasAny ? 'text-gray-900' : 'text-gray-500')}>
                      {r.label}
                    </span>

                    {/* Action checkboxes */}
                    <div className="flex gap-2">
                      {['view', 'create', 'edit', 'delete'].map(action => {
                        const available = r.actions.includes(action);
                        const checked = available && currentSet.has(action);
                        return (
                          <button
                            key={action}
                            disabled={!available}
                            onClick={() => available && toggleAction(r.key, action)}
                            className={cn(
                              'w-14 h-7 rounded-lg border text-[10px] font-bold transition-all',
                              !available
                                ? 'border-gray-100 text-gray-200 bg-gray-50 cursor-not-allowed'
                                : checked
                                ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                                : 'border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-500',
                            )}
                          >
                            {available ? ACTION_LABELS[action] : '-'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3 shrink-0 border-t border-gray-100 mt-2">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar Permissoes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [schedule, setSchedule] = useState<any>(DEFAULT_SCHEDULE);
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load existing schedule for this member
    setLoading(false);
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await scheduleApi.saveMemberSchedule(agent.id, { schedule, timezone, enabled });
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 1500);
    } catch { }
    setSaving(false);
  }

  function updateDay(key: string, field: string, value: any) {
    setSchedule((prev: any) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Horario de Trabalho</h2>
            <p className="text-sm text-gray-500 mt-0.5">{agent.full_name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Enable toggle */}
          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <div>
              <div className="text-sm font-bold text-gray-900">Horario de atendimento ativo</div>
              <div className="text-xs text-gray-500 mt-0.5">Quando desativado, o agente nao recebe conversas automaticamente</div>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`w-12 h-6 rounded-full transition-all relative ${enabled ? 'bg-indigo-500' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${enabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* Timezone */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fuso Horario</label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="America/Sao_Paulo">Brasilia (UTC-3)</option>
              <option value="America/Manaus">Manaus (UTC-4)</option>
              <option value="America/Fortaleza">Fortaleza (UTC-3)</option>
              <option value="America/Belem">Belem (UTC-3)</option>
              <option value="America/Cuiaba">Cuiaba (UTC-4)</option>
              <option value="America/Porto_Velho">Porto Velho (UTC-4)</option>
              <option value="America/Boa_Vista">Boa Vista (UTC-4)</option>
              <option value="America/Rio_Branco">Rio Branco (UTC-5)</option>
              <option value="America/Noronha">Fernando de Noronha (UTC-2)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          {/* Days */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dias e Horarios</label>
            {DAYS.map(day => {
              const d = schedule[day.key] || { enabled: false, start: '09:00', end: '18:00' };
              return (
                <div key={day.key} className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border transition', d.enabled ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-100 bg-gray-50/30')}>
                  <button
                    onClick={() => updateDay(day.key, 'enabled', !d.enabled)}
                    className={`w-10 h-5 rounded-full transition relative shrink-0 ${d.enabled ? 'bg-indigo-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${d.enabled ? 'left-5' : 'left-1'}`} />
                  </button>
                  <span className={`text-xs font-bold w-16 ${d.enabled ? 'text-gray-800' : 'text-gray-400'}`}>{day.label}</span>
                  {d.enabled ? (
                    <>
                      <input type="time" value={d.start} onChange={e => updateDay(day.key, 'start', e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white" />
                      <span className="text-xs text-gray-400">ate</span>
                      <input type="time" value={d.end} onChange={e => updateDay(day.key, 'end', e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white" />
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Folga</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar Horario'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [error, setError] = useState('');
  const [scheduleAgent, setScheduleAgent] = useState<Agent | null>(null);
  const [permissionsAgent, setPermissionsAgent] = useState<Agent | null>(null);

  useEffect(() => {
    usersApi.list().then(setAgents);
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInviting(true);
    try {
      await usersApi.invite(inviteEmail, inviteRole);
      setInviteSuccess(`Convite enviado para ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('agent');
      setTimeout(() => setInviteSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar convite');
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
          <p className="text-gray-500 mt-1">Gerencie os atendentes e seus horarios de trabalho</p>
        </div>

        {/* Invite form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-800">Convidar atendente</h2>
          </div>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="flex gap-3">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@atendente.com"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
              >
                <option value="agent">Atendente</option>
                <option value="supervisor">Supervisor</option>
                <option value="manager">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
            >
              <Mail className="w-4 h-4" />
              {inviting ? 'Enviando...' : 'Enviar Convite por E-mail'}
            </button>
          </form>
          {inviteSuccess && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              {inviteSuccess}
            </div>
          )}
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        {/* Agents list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-bold text-gray-900 text-sm uppercase tracking-tight">
              Equipe Atual ({agents.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {agents.map((agent) => (
              <div key={agent.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0">
                  {getInitials(agent.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{agent.full_name}</p>
                  <p className="text-xs text-gray-400">{agent.email}</p>
                </div>
                <span className={cn('text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border', ROLE_COLORS[agent.role] || ROLE_COLORS.agent)}>
                  {ROLE_LABELS[agent.role] || agent.role}
                </span>
                <button
                  onClick={() => setPermissionsAgent(agent)}
                  title="Configurar permissoes"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition"
                >
                  <Shield className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setScheduleAgent(agent)}
                  title="Configurar horario"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  <Clock className="w-4 h-4" />
                </button>
              </div>
            ))}
            {agents.length === 0 && (
              <div className="px-6 py-10 text-center text-gray-400 text-sm">
                Nenhum atendente encontrado. Convide um acima.
              </div>
            )}
          </div>
        </div>
      </div>

      {scheduleAgent && (
        <ScheduleModal agent={scheduleAgent} onClose={() => setScheduleAgent(null)} />
      )}
      {permissionsAgent && (
        <PermissionsModal agent={permissionsAgent} onClose={() => setPermissionsAgent(null)} />
      )}
    </div>
  );
}
