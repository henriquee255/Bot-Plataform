'use client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Check, Zap, Award, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const PLANS = [
    {
        key: 'monthly',
        name: 'Mensal',
        price: 'R$ 97',
        period: '/mês',
        icon: Zap,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        features: ['Atendentes ilimitados', 'Todos os setores', 'Suporte prioritário', 'Dashboards básicos'],
    },
    {
        key: 'annual',
        name: 'Anual',
        price: 'R$ 997',
        period: '/ano',
        popular: true,
        icon: Award,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        features: ['Tudo do mensal', 'Domínio personalizado', 'Treinamento VIP', 'Dashboards avançados'],
    },
    {
        key: 'lifetime',
        name: 'Vitalício',
        price: 'R$ 2.497',
        period: ' pagamento único',
        limited: true,
        icon: Star,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        features: ['Acesso vitalício', 'White Label total', 'API Prioritária', 'Consultoria estratégica'],
    },
];

export default function PlansPage() {
    const router = useRouter();
    const { user, setAuth, accessToken, refreshToken } = useAuthStore();

    async function selectPlan(planKey: string) {
        try {
            if (!user) return;
            await api.patch(`/admin/companies/${user.companyId}`, { plan: planKey });
            if (user && accessToken && refreshToken) {
                setAuth({
                    ...user,
                    company: { plan: planKey, status: 'active' }
                }, accessToken, refreshToken);
            }
            router.push('/inbox');
        } catch (e) {
            console.error('Failed to select plan:', e);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Escolha o seu plano</h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        Selecione a melhor opção para escalar o atendimento da sua empresa com inteligência e profissionalismo.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.key}
                            className={cn(
                                "relative bg-white rounded-3xl p-8 shadow-xl border-2 transition-all hover:scale-105",
                                plan.popular ? "border-indigo-600 scale-105 z-10" : "border-transparent"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-8 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                                    Mais Popular
                                </div>
                            )}
                            {plan.limited && (
                                <div className="absolute top-0 right-8 -translate-y-1/2 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                                    Oferta Limitada
                                </div>
                            )}

                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", plan.bg)}>
                                <plan.icon className={cn("w-7 h-7", plan.color)} />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h2>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                                <span className="text-gray-400 font-medium">{plan.period}</span>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => selectPlan(plan.key)}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-bold transition shadow-md",
                                    plan.popular
                                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                                        : "bg-gray-900 text-white hover:bg-gray-800"
                                )}
                            >
                                Começar Agora
                            </button>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-gray-400 hover:text-gray-600 font-medium text-sm underline underline-offset-4"
                    >
                        Pular por enquanto e configurar o painel
                    </button>
                </div>
            </div>
        </div>
    );
}
