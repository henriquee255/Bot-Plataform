'use client';
import { useEffect, useState } from 'react';
import {
    Plus, Trash2, Edit2, Users, X, Check, Search,
    Building2, ChevronRight, Circle, ToggleLeft, ToggleRight,
} from 'lucide-react';

const API = 'http://localhost:3001/api';

function getToken() {
    try {
        return JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.accessToken ?? '';
    } catch {
        return '';
    }
}

async function apiFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
            ...((options.headers as Record<string, string>) || {}),
        },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
}

interface Sector {
    id: string;
    name: string;
    description: string;
    color: string;
    is_active: boolean;
    member_count: number;
    created_at: string;
}

interface Member {
    id: string;
    full_name: string;
    email: string;
    role: string;
    avatar_url: string | null;
}

interface TeamUser {
    id: string;
    full_name: string;
    email: string;
    role: string;
    avatar_url: string | null;
}

const PRESET_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6', '#64748b', '#1e293b',
];

function getInitials(name: string) {
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function Avatar({ name, avatarUrl, size = 8 }: { name: string; avatarUrl: string | null; size?: number }) {
    return avatarUrl ? (
        <img
            src={avatarUrl}
            alt={name}
            className={`w-${size} h-${size} rounded-full object-cover`}
        />
    ) : (
        <div
            className={`w-${size} h-${size} rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold`}
        >
            {getInitials(name)}
        </div>
    );
}

// ─── Modal base ────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

// ─── Sector Form Modal ─────────────────────────────────────────────────────────
function SectorFormModal({
    open,
    onClose,
    sector,
    onSave,
}: {
    open: boolean;
    onClose: () => void;
    sector: Partial<Sector> | null;
    onSave: (data: { name: string; description: string; color: string; is_active: boolean }) => Promise<void>;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#6366f1');
    const [isActive, setIsActive] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setName(sector?.name ?? '');
            setDescription(sector?.description ?? '');
            setColor(sector?.color ?? '#6366f1');
            setIsActive(sector?.is_active ?? true);
            setError('');
        }
    }, [open, sector]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) { setError('Nome é obrigatório'); return; }
        setSaving(true);
        setError('');
        try {
            await onSave({ name: name.trim(), description: description.trim(), color, is_active: isActive });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar setor');
        } finally {
            setSaving(false);
        }
    }

    const isEdit = !!sector?.id;

    return (
        <Modal open={open} onClose={onClose} title={isEdit ? 'Editar Setor' : 'Novo Setor'}>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Ex: Comercial, Suporte, Financeiro..."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition bg-gray-50"
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Descrição
                    </label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Descreva o propósito deste setor..."
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition bg-gray-50 resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cor do Setor
                    </label>
                    <div className="flex items-center gap-3 flex-wrap">
                        {PRESET_COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center ring-2 ring-offset-1"
                                style={{
                                    backgroundColor: c,
                                    outlineColor: color === c ? c : 'transparent',
                                }}
                                title={c}
                            >
                                {color === c && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                            </button>
                        ))}
                        <input
                            type="color"
                            value={color}
                            onChange={e => setColor(e.target.value)}
                            className="w-7 h-7 p-0.5 border border-gray-200 rounded-full cursor-pointer bg-white"
                            title="Cor personalizada"
                        />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-xs text-gray-400 font-mono">{color}</span>
                    </div>
                </div>

                {isEdit && (
                    <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                            <div className="text-sm font-semibold text-gray-700">Status</div>
                            <div className="text-xs text-gray-400">{isActive ? 'Setor ativo' : 'Setor inativo'}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsActive(!isActive)}
                            className="text-2xl transition"
                        >
                            {isActive
                                ? <ToggleRight className="w-8 h-8 text-indigo-600" />
                                : <ToggleLeft className="w-8 h-8 text-gray-400" />
                            }
                        </button>
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isEdit ? 'Salvar Alterações' : 'Criar Setor'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ─── Members Modal ──────────────────────────────────────────────────────────────
function MembersModal({
    open,
    onClose,
    sector,
}: {
    open: boolean;
    onClose: () => void;
    sector: Sector | null;
}) {
    const [members, setMembers] = useState<Member[]>([]);
    const [team, setTeam] = useState<TeamUser[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);

    useEffect(() => {
        if (open && sector) {
            loadData();
            setSearch('');
        }
    }, [open, sector]);

    async function loadData() {
        if (!sector) return;
        setLoading(true);
        try {
            const [membersData, teamData] = await Promise.all([
                apiFetch(`/sectors/${sector.id}/members`),
                apiFetch('/users/team'),
            ]);
            setMembers(membersData || []);
            setTeam(teamData || []);
        } catch (err) {
            console.error('Erro ao carregar membros:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddMember(userId: string) {
        if (!sector) return;
        setAdding(true);
        try {
            await apiFetch(`/sectors/${sector.id}/members`, {
                method: 'POST',
                body: JSON.stringify({ userId }),
            });
            await loadData();
        } catch (err: any) {
            alert(err.message || 'Erro ao adicionar membro');
        } finally {
            setAdding(false);
        }
    }

    async function handleRemoveMember(userId: string) {
        if (!sector) return;
        setRemoving(userId);
        try {
            await apiFetch(`/sectors/${sector.id}/members/${userId}`, { method: 'DELETE' });
            setMembers(prev => prev.filter(m => m.id !== userId));
        } catch (err: any) {
            alert(err.message || 'Erro ao remover membro');
        } finally {
            setRemoving(null);
        }
    }

    const memberIds = new Set(members.map(m => m.id));
    const filteredTeam = team.filter(
        u => !memberIds.has(u.id) &&
            (u.full_name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase()))
    );

    const roleLabel: Record<string, string> = {
        admin: 'Admin', manager: 'Gerente', supervisor: 'Supervisor', agent: 'Agente',
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={sector ? `Membros — ${sector.name}` : 'Membros'}
        >
            <div className="p-6 flex flex-col gap-5">
                {/* Current members */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                            Membros Atuais
                        </h3>
                        <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
                            {members.length}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-6">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : members.length === 0 ? (
                        <div className="text-center py-6 text-sm text-gray-400">
                            Nenhum membro neste setor ainda.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {members.map(member => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Avatar name={member.full_name} avatarUrl={member.avatar_url} size={8} />
                                        <div>
                                            <div className="text-sm font-semibold text-gray-800">{member.full_name}</div>
                                            <div className="text-xs text-gray-400">{member.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                            {roleLabel[member.role] || member.role}
                                        </span>
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            disabled={removing === member.id}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                            title="Remover membro"
                                        >
                                            {removing === member.id
                                                ? <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                                : <X className="w-3.5 h-3.5" />
                                            }
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add members from team */}
                <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                        Adicionar da Equipe
                    </h3>
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por nome ou email..."
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition bg-gray-50"
                        />
                    </div>

                    {filteredTeam.length === 0 ? (
                        <div className="text-center py-4 text-sm text-gray-400">
                            {search ? 'Nenhum resultado para a busca.' : 'Todos os membros da equipe já foram adicionados.'}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                            {filteredTeam.map(u => (
                                <div
                                    key={u.id}
                                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:bg-indigo-50 hover:border-indigo-200 transition group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Avatar name={u.full_name} avatarUrl={u.avatar_url} size={8} />
                                        <div>
                                            <div className="text-sm font-semibold text-gray-800">{u.full_name}</div>
                                            <div className="text-xs text-gray-400">{u.email}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAddMember(u.id)}
                                        disabled={adding}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-white hover:bg-indigo-600 px-3 py-1.5 rounded-lg transition border border-indigo-200 hover:border-indigo-600"
                                    >
                                        {adding
                                            ? <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                            : <Plus className="w-3.5 h-3.5" />
                                        }
                                        Adicionar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SectorsPage() {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Sector form modal
    const [formOpen, setFormOpen] = useState(false);
    const [editingSector, setEditingSector] = useState<Partial<Sector> | null>(null);

    // Members modal
    const [membersOpen, setMembersOpen] = useState(false);
    const [selectedSector, setSelectedSector] = useState<Sector | null>(null);

    // Delete confirm
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadSectors();
    }, []);

    async function loadSectors() {
        setLoading(true);
        setError('');
        try {
            const data = await apiFetch('/sectors');
            setSectors(data || []);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar setores');
        } finally {
            setLoading(false);
        }
    }

    function openCreate() {
        setEditingSector(null);
        setFormOpen(true);
    }

    function openEdit(sector: Sector) {
        setEditingSector(sector);
        setFormOpen(true);
    }

    function openMembers(sector: Sector) {
        setSelectedSector(sector);
        setMembersOpen(true);
    }

    async function handleSave(data: { name: string; description: string; color: string; is_active: boolean }) {
        if (editingSector?.id) {
            const updated = await apiFetch(`/sectors/${editingSector.id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
            setSectors(prev => prev.map(s => s.id === editingSector.id ? { ...s, ...updated } : s));
        } else {
            const created = await apiFetch('/sectors', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            setSectors(prev => [...prev, { ...created, member_count: 0 }]);
        }
    }

    async function handleDelete(id: string) {
        setDeletingId(id);
        try {
            await apiFetch(`/sectors/${id}`, { method: 'DELETE' });
            setSectors(prev => prev.filter(s => s.id !== id));
        } catch (err: any) {
            alert(err.message || 'Erro ao excluir setor');
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="max-w-5xl mx-auto p-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Setores</h1>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm ml-11.5">
                            Organize sua equipe em departamentos e gerencie os membros de cada setor.
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Setor
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 mb-6 text-sm">
                        {error}
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-400">Carregando setores...</span>
                    </div>
                ) : sectors.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-16 flex flex-col items-center justify-center shadow-sm">
                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
                            <Building2 className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">Nenhum setor criado</h3>
                        <p className="text-gray-400 dark:text-gray-500 text-sm text-center mb-6 max-w-xs">
                            Crie setores para organizar sua equipe em departamentos como Suporte, Vendas e Financeiro.
                        </p>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition"
                        >
                            <Plus className="w-4 h-4" />
                            Criar Primeiro Setor
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sectors.map(sector => (
                            <div
                                key={sector.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group"
                            >
                                {/* Color bar */}
                                <div
                                    className="h-1.5 rounded-t-2xl"
                                    style={{ backgroundColor: sector.color || '#6366f1' }}
                                />

                                <div className="p-5">
                                    {/* Top row */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: (sector.color || '#6366f1') + '20' }}
                                            >
                                                <Circle
                                                    className="w-4 h-4"
                                                    style={{ color: sector.color || '#6366f1' }}
                                                    fill={sector.color || '#6366f1'}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                                                    {sector.name}
                                                </h3>
                                                {!sector.is_active && (
                                                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                                        Inativo
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEdit(sector)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                                                title="Editar setor"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Excluir o setor "${sector.name}"? Esta ação não pode ser desfeita.`)) {
                                                        handleDelete(sector.id);
                                                    }
                                                }}
                                                disabled={deletingId === sector.id}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                                                title="Excluir setor"
                                            >
                                                {deletingId === sector.id
                                                    ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                    : <Trash2 className="w-4 h-4" />
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {sector.description ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                                            {sector.description}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-300 dark:text-gray-600 italic mb-4">
                                            Sem descrição
                                        </p>
                                    )}

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700">
                                        <button
                                            onClick={() => openMembers(sector)}
                                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition font-medium"
                                        >
                                            <Users className="w-4 h-4" />
                                            <span>
                                                {sector.member_count === 0
                                                    ? 'Sem membros'
                                                    : `${sector.member_count} membro${sector.member_count !== 1 ? 's' : ''}`
                                                }
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => openMembers(sector)}
                                            className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition"
                                        >
                                            Gerenciar
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats bar */}
                {!loading && sectors.length > 0 && (
                    <div className="mt-6 flex items-center gap-6 text-sm text-gray-400">
                        <span>{sectors.length} setor{sectors.length !== 1 ? 'es' : ''} no total</span>
                        <span>{sectors.filter(s => s.is_active).length} ativo{sectors.filter(s => s.is_active).length !== 1 ? 's' : ''}</span>
                        <span>{sectors.reduce((acc, s) => acc + (s.member_count || 0), 0)} membros atribuídos</span>
                    </div>
                )}
            </div>

            {/* Modals */}
            <SectorFormModal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                sector={editingSector}
                onSave={handleSave}
            />
            <MembersModal
                open={membersOpen}
                onClose={() => {
                    setMembersOpen(false);
                    // Refresh member counts
                    loadSectors();
                }}
                sector={selectedSector}
            />
        </div>
    );
}
