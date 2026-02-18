'use client';
import { useEffect, useState } from 'react';
import { companyApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
    Building2,
    Users,
    ShieldCheck,
    Infinity as InfinityIcon,
    Package,
    Trash2,
    Mail,
    MoreVertical,
    Calendar,
    Shield
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function CompanySettingsPage() {
    const { user } = useAuthStore();
    const [company, setCompany] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyName, setCompanyName] = useState('');

    useEffect(() => {
        Promise.all([
            companyApi.get(),
            companyApi.getMembers()
        ]).then(([c, m]) => {
            setCompany(c);
            setCompanyName(c.name);
            setMembers(m);
        }).finally(() => setLoading(false));
    }, []);

    async function handleUpdateCompany(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await companyApi.updateMyCompany({ name: companyName });
            setCompany({ ...company, name: companyName });
            alert('Configurações salvas!');
        } finally {
            setSaving(false);
        }
    }

    async function handleRemoveMember(memberId: string) {
        if (!confirm('Tem certeza que deseja remover este membro?')) return;
        try {
            await companyApi.removeMember(memberId);
            setMembers(members.filter(m => m.id !== memberId));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao remover membro');
        }
    }

    if (loading) {
        return (
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
                <Skeleton className="h-10 w-48 rounded-xl" />
                <Skeleton className="h-64 w-full rounded-[2.5rem]" />
                <Skeleton className="h-96 w-full rounded-[2.5rem]" />
            </div>
        );
    }

    const isOwner = user?.role === 'owner' || user?.role === 'superadmin';

    return (
        <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Configurações da Empresa</h1>
                        <p className="text-sm text-gray-500">Gerencie os detalhes do seu negócio e sua equipe</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <span className={`w-3 h-3 rounded-full ${company?.plan !== 'free' ? 'bg-indigo-500 animate-pulse' : 'bg-gray-300'}`} />
                        <span className="text-sm font-bold text-gray-700 capitalize">Plano {company?.plan}</span>
                    </div>
                </div>

                {/* Informações da Empresa */}
                <div className="bg-white rounded-[2.2rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-2xl font-bold uppercase">
                            {company?.name[0]}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Perfil da Empresa</h2>
                            <p className="text-xs text-gray-400 font-medium">Informações visíveis para sua equipe</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateCompany} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nome da Empresa</label>
                            <input
                                type="text"
                                disabled={!isOwner}
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm disabled:bg-gray-50 disabled:text-gray-400 transition-all"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Slug (Link único)</label>
                            <input
                                type="text"
                                disabled
                                value={company?.slug}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
                            />
                        </div>

                        <div className="md:col-span-2 flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={saving || !isOwner}
                                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Gestão de Equipe */}
                <div className="bg-white rounded-[2.2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 rounded-xl">
                                <Users className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Membros da Equipe</h2>
                                <p className="text-xs text-gray-400 font-medium">{members.length} membros ativos</p>
                            </div>
                        </div>
                        <button className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition">
                            Convidar Membro
                        </button>
                    </div>

                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Membro</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Papeis</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {members.map((m) => (
                                <tr key={m.id} className="hover:bg-gray-50/30 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm shadow-inner group-hover:ring-2 group-hover:ring-indigo-100 transition-all">
                                                {m.full_name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-sm">{m.full_name}</div>
                                                <div className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                                                    <Mail className="w-3 h-3" />
                                                    {m.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${m.role === 'owner' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100' : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'}`}>
                                            <Shield className="w-2.5 h-2.5" />
                                            {m.role === 'owner' ? 'Dono' : 'Agente'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        {isOwner && m.role !== 'owner' && (
                                            <button
                                                onClick={() => handleRemoveMember(m.id)}
                                                className="p-2 hover:bg-red-50 rounded-xl transition text-gray-300 hover:text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
