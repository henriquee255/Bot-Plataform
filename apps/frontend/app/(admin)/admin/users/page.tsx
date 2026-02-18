'use client';
import { useEffect, useState, useRef } from 'react';
import { adminApi } from '@/lib/api';
import {
    Search,
    UserX,
    UserCheck,
    RefreshCcw,
    UserCircle,
    Building,
    Trash2,
    ChevronDown,
    X,
    Eye,
    ShieldCheck,
    LogIn,
    AlertCircle,
    CheckCircle,
    Clock,
    Filter,
    MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AdminUser {
    id: string;
    full_name: string;
    email: string;
    role: string;
    status: string;
    company?: { id: string; name: string };
    is_superadmin?: boolean;
    last_seen_at?: string;
    created_at?: string;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string; icon: any }> = {
        active:    { label: 'Ativo',     cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
        blocked:   { label: 'Suspenso',  cls: 'bg-red-500/15 text-red-400 border-red-500/30',             icon: UserX },
        suspended: { label: 'Suspenso',  cls: 'bg-red-500/15 text-red-400 border-red-500/30',             icon: UserX },
        pending:   { label: 'Pendente',  cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',       icon: Clock },
        inactive:  { label: 'Inativo',   cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30',          icon: AlertCircle },
    };
    const cfg = map[status] ?? map['inactive'];
    const Icon = cfg.icon;
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border', cfg.cls)}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role, isSuperAdmin }: { role: string; isSuperAdmin?: boolean }) {
    if (isSuperAdmin) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-tighter">
            <ShieldCheck className="w-2.5 h-2.5" /> System God
        </span>
    );
    const map: Record<string, string> = {
        owner: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
        admin: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
        agent: 'bg-gray-700 text-gray-300 border border-gray-600',
    };
    return (
        <span className={cn('inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest', map[role] ?? 'bg-gray-700 text-gray-400')}>
            {role}
        </span>
    );
}

// ─── User Detail Drawer ───────────────────────────────────────────────────────
function UserDrawer({ user, onClose, onRefresh }: { user: AdminUser; onClose: () => void; onRefresh: () => void }) {
    const [saving, setSaving] = useState(false);
    const [role, setRole] = useState(user.role);
    const [toast, setToast] = useState<string | null>(null);

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    }

    async function handleSaveRole() {
        setSaving(true);
        try {
            await adminApi.updateUser(user.id, { role });
            showToast('Role atualizada com sucesso');
            onRefresh();
        } catch { showToast('Erro ao salvar role'); }
        finally { setSaving(false); }
    }

    async function handleToggleStatus() {
        const next = user.status === 'active' ? 'blocked' : 'active';
        if (!confirm(`Confirmar: alterar status para "${next}"?`)) return;
        try {
            await adminApi.updateUser(user.id, { status: next });
            showToast('Status alterado');
            onRefresh();
            onClose();
        } catch { showToast('Erro ao alterar status'); }
    }

    async function handleResend() {
        try {
            const data = await adminApi.resendAccess(user.id);
            showToast(data.tempPassword ? `Senha temporária: ${data.tempPassword}` : 'E-mail de acesso enviado!');
        } catch { showToast('Erro ao reenviar acesso'); }
    }

    async function handleImpersonate() {
        if (!confirm(`Você vai logar como ${user.full_name}. Continuar?`)) return;
        try {
            const data = await adminApi.impersonateUser(user.id);
            if (data?.accessToken) {
                localStorage.setItem('accessToken', data.accessToken);
                if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
                window.location.href = '/dashboard';
            }
        } catch { showToast('Erro ao impersonar usuário'); }
    }

    async function handleToggleSuperadmin() {
        const action = user.is_superadmin ? 'remover acesso de Superadmin' : 'conceder acesso de Superadmin';
        if (!confirm(`Tem certeza que deseja ${action} para ${user.full_name}?`)) return;
        try {
            await adminApi.toggleSuperadmin(user.id);
            showToast(user.is_superadmin ? 'Superadmin removido' : 'Superadmin concedido!');
            onRefresh();
            onClose();
        } catch { showToast('Erro ao alterar superadmin'); }
    }

    async function handleDelete() {
        if (!confirm(`ATENÇÃO: Deletar permanentemente ${user.full_name}? Esta ação é irreversível!`)) return;
        if (!confirm('Confirmação final: deletar este usuário?')) return;
        try {
            await adminApi.deleteUser(user.id);
            showToast('Usuário deletado');
            onRefresh();
            onClose();
        } catch { showToast('Erro ao deletar usuário'); }
    }

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-[420px] bg-gray-900 border-l border-gray-700 z-50 overflow-y-auto shadow-2xl">
                {toast && (
                    <div className="fixed top-4 right-4 bg-gray-800 border border-gray-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl z-[60]">
                        {toast}
                    </div>
                )}

                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                    <h2 className="text-white font-black text-lg">Detalhes do Usuário</h2>
                    <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Avatar + Info */}
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-xl font-black text-gray-300">
                            {user.full_name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                            <p className="text-white font-black text-lg leading-none mb-1">{user.full_name}</p>
                            <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <StatusBadge status={user.status} />
                        <RoleBadge role={user.role} isSuperAdmin={user.is_superadmin} />
                    </div>
                </div>

                {/* Metadata */}
                <div className="p-6 border-b border-gray-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Empresa</span>
                        <span className="text-white text-sm font-bold">{user.company?.name || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Membro desde</span>
                        <span className="text-white text-sm font-mono">{user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Último acesso</span>
                        <span className="text-white text-sm font-mono">{user.last_seen_at ? new Date(user.last_seen_at).toLocaleString('pt-BR') : 'Nunca'}</span>
                    </div>
                </div>

                {/* Edit Role */}
                <div className="p-6 border-b border-gray-800">
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-3">Alterar Role</p>
                    <div className="flex gap-2">
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                        >
                            <option value="agent">Agent</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                        </select>
                        <button
                            onClick={handleSaveRole}
                            disabled={saving || role === user.role}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-40"
                        >
                            {saving ? '...' : 'Salvar'}
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 space-y-3">
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-4">Ações</p>

                    <button
                        onClick={handleToggleStatus}
                        className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition',
                            user.status === 'active'
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        )}
                    >
                        {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        {user.status === 'active' ? 'Suspender Conta' : 'Ativar Conta'}
                    </button>

                    <button
                        onClick={handleResend}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Reenviar Acesso / Resetar Senha
                    </button>

                    <button
                        onClick={handleImpersonate}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 transition"
                    >
                        <LogIn className="w-4 h-4" />
                        Impersonar (Logar como esse usuário)
                    </button>

                    <button
                        onClick={handleToggleSuperadmin}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border transition mt-2 ${user.is_superadmin ? 'bg-red-900/20 hover:bg-red-900/40 text-red-400 border-red-500/30' : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        {user.is_superadmin ? 'Remover Superadmin' : 'Conceder Superadmin'}
                    </button>

                    {!user.is_superadmin && (
                        <button
                            onClick={handleDelete}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 transition mt-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Deletar Usuário Permanentemente
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selected, setSelected] = useState<AdminUser | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => { loadUsers(); }, []);

    async function loadUsers(q = search, role = roleFilter, status = statusFilter) {
        setLoading(true);
        try {
            const data = await adminApi.listUsers(q || undefined, role || undefined, status || undefined);
            setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    function handleSearch(val: string) {
        setSearch(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => loadUsers(val, roleFilter, statusFilter), 400);
    }

    function handleRoleFilter(val: string) {
        setRoleFilter(val);
        loadUsers(search, val, statusFilter);
    }

    function handleStatusFilter(val: string) {
        setStatusFilter(val);
        loadUsers(search, roleFilter, val);
    }

    function showToast(type: 'success' | 'error', msg: string) {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    }

    const activeFilters = [roleFilter, statusFilter].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-gray-950 p-8 pb-16">
            {/* Toast */}
            {toast && (
                <div className={cn(
                    'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold',
                    toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                )}>
                    {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Gestão de Usuários</h1>
                    <p className="text-gray-400 font-medium mt-1">Controle total sobre todos os usuários da plataforma.</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total</p>
                    <p className="text-white text-2xl font-black">{users.length}</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou e-mail..."
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition"
                    />
                    {search && (
                        <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Role Filter */}
                <div className="relative">
                    <Filter className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                        value={roleFilter}
                        onChange={e => handleRoleFilter(e.target.value)}
                        className="pl-8 pr-8 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 appearance-none cursor-pointer"
                    >
                        <option value="">Todas as Roles</option>
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={e => handleStatusFilter(e.target.value)}
                        className="pl-3 pr-8 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 appearance-none cursor-pointer"
                    >
                        <option value="">Todos os Status</option>
                        <option value="active">Ativos</option>
                        <option value="blocked">Suspensos</option>
                        <option value="pending">Pendentes</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {activeFilters > 0 && (
                    <button
                        onClick={() => { setRoleFilter(''); setStatusFilter(''); loadUsers(search, '', ''); }}
                        className="flex items-center gap-1.5 px-3 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold rounded-xl border border-red-600/30 transition"
                    >
                        <X className="w-3.5 h-3.5" />
                        Limpar filtros ({activeFilters})
                    </button>
                )}

                <button
                    onClick={() => loadUsers()}
                    className="ml-auto p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition"
                    title="Atualizar"
                >
                    <RefreshCcw className={cn('w-4 h-4', loading && 'animate-spin')} />
                </button>
            </div>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center">
                        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 font-bold text-sm">Carregando usuários...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-16 text-center">
                        <UserCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold">Nenhum usuário encontrado</p>
                        <p className="text-gray-600 text-sm mt-1">Tente ajustar os filtros de busca</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-800 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Usuário</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Empresa</th>
                                    <th className="px-6 py-4">Criado em</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-800/50 transition-colors group">
                                        {/* User */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center font-black text-gray-300 text-sm flex-shrink-0">
                                                    {user.full_name?.[0]?.toUpperCase() ?? <UserCircle className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-sm leading-none mb-0.5">{user.full_name}</p>
                                                    <p className="text-gray-500 text-xs">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role */}
                                        <td className="px-6 py-4">
                                            <RoleBadge role={user.role} isSuperAdmin={user.is_superadmin} />
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <StatusBadge status={user.status} />
                                        </td>

                                        {/* Company */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Building className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                                                <span className="text-sm font-medium truncate max-w-[140px]">{user.company?.name || '—'}</span>
                                            </div>
                                        </td>

                                        {/* Created */}
                                        <td className="px-6 py-4">
                                            <span className="text-gray-500 text-xs font-mono">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '—'}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => setSelected(user)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold rounded-lg border border-gray-700 transition"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Ver
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        const next = user.status === 'active' ? 'blocked' : 'active';
                                                        if (!confirm(`Alterar status para "${next}"?`)) return;
                                                        try {
                                                            await adminApi.updateUser(user.id, { status: next });
                                                            loadUsers();
                                                        } catch { }
                                                    }}
                                                    className={cn(
                                                        'p-1.5 rounded-lg transition',
                                                        user.status === 'active'
                                                            ? 'text-gray-500 hover:text-red-400 hover:bg-red-400/10'
                                                            : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-400/10'
                                                    )}
                                                    title={user.status === 'active' ? 'Suspender' : 'Ativar'}
                                                >
                                                    {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                </button>
                                                {!user.is_superadmin && (
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm(`Deletar permanentemente ${user.full_name}?`)) return;
                                                            if (!confirm('Confirmar exclusão? Irreversível!')) return;
                                                            try {
                                                                await adminApi.deleteUser(user.id);
                                                                loadUsers();
                                                            } catch { }
                                                        }}
                                                        className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                                                        title="Deletar"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Drawer */}
            {selected && (
                <UserDrawer
                    user={selected}
                    onClose={() => setSelected(null)}
                    onRefresh={loadUsers}
                />
            )}
        </div>
    );
}
