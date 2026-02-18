'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { invitationsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { UserPlus, ShieldCheck } from 'lucide-react';

export default function InviteAcceptPage() {
    const { token } = useParams();
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [invitation, setInvitation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        fullName: '',
        password: '',
    });

    useEffect(() => {
        if (token) {
            invitationsApi.get(token as string)
                .then(setInvitation)
                .catch(() => setError('Convite inválido ou expirado.'))
                .finally(() => setLoading(false));
        }
    }, [token]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!token) return;
        setError('');
        setSubmitting(true);
        try {
            const data = await invitationsApi.accept(token as string, form);
            // O accept retorna o usuário criado? InvitationsService.accept retorna user.
            // Mas precisamos do token? O ideal seria fazer login automático.
            // No service.ts, accept retorna o user. Vamos assumir que precisamos logar.
            // Por simplicidade, redirecionar para login com mensagem de sucesso.
            router.push('/login?message=Sucesso! Sua conta foi criada, faça login para entrar na equipe.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao aceitar convite.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <div className="p-8 text-center">Carregando convite...</div>;
    if (error && !invitation) return <div className="p-8 text-center text-red-600 font-bold">{error}</div>;

    return (
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <UserPlus className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Você foi convidado!</h1>
                <p className="text-gray-500 mt-2">
                    Você está sendo convidado para entrar na equipe como
                    <span className="font-bold text-indigo-600 ml-1 uppercase">
                        {invitation.role === 'admin' ? 'Administrador' : invitation.role === 'manager' ? 'Gerente' : invitation.role === 'supervisor' ? 'Supervisor' : 'Atendente'}
                    </span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Seu Nome Completo</label>
                    <input
                        type="text"
                        required
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                        placeholder="Como quer ser chamado?"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Defina sua Senha</label>
                    <input
                        type="password"
                        required
                        minLength={8}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                        placeholder="No mínimo 8 caracteres"
                    />
                </div>

                {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl">{error}</div>}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                    <ShieldCheck className="w-5 h-5" />
                    {submitting ? 'Criando conta...' : 'Aceitar Convite'}
                </button>
            </form>
        </div>
    );
}
