'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import {
    LayoutDashboard,
    Building2,
    Users,
    CreditCard,
    Settings,
    ShieldAlert,
    LogOut,
    ChevronLeft,
    Activity,
    Server,
    Smartphone,
    Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, clearAuth } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (hydrated && (!user || !user.is_superadmin)) {
            router.replace('/dashboard');
        }
    }, [user, hydrated, router]);

    if (!hydrated || !user || !user.is_superadmin) {
        return null;
    }

    const menuItems = [
        { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Geral' },
        { href: '/admin/companies', icon: Building2, label: 'Empresas' },
        { href: '/admin/users', icon: Users, label: 'Usuários & Superadmins' },
        { href: '/admin/plans', icon: CreditCard, label: 'Planos & Subscrições' },
        { href: '/admin/whatsapp-plans', icon: Smartphone, label: 'WhatsApp por Plano' },
        { href: '/admin/activity', icon: Activity, label: 'Logs de Atividade' },
        { href: '/admin/platform', icon: Palette, label: 'Identidade da Plataforma' },
        { href: '/admin/system', icon: Server, label: 'Sistema & Saúde' },
        { href: '/admin/settings', icon: Settings, label: 'Configurações Globais' },
    ];

    const isSystemGod = user.is_superadmin && user.email?.includes('system') || user.role === 'owner';
    const displayName = user.fullName || user.email || 'Admin';
    const initials = displayName.charAt(0).toUpperCase();

    return (
        <div className="flex h-screen bg-gray-900 overflow-hidden">
            {/* Super Admin Sidebar */}
            <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col shadow-2xl z-50">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
                            <ShieldAlert className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-black tracking-tight leading-none uppercase text-lg">Super Admin</h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Platform Control</p>
                        </div>
                    </div>

                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-white/5 hover:text-white transition group border border-white/5"
                    >
                        <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                        Voltar ao Painel
                    </Link>
                </div>

                {/* Scrollable Nav */}
                <nav className="flex-1 overflow-y-auto px-4 space-y-1 pb-4">
                    {menuItems.map((item) => {
                        const active = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group",
                                    active
                                        ? "bg-red-600 text-white shadow-lg shadow-red-900/40"
                                        : "hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 shrink-0", active ? "text-white" : "text-slate-500 group-hover:text-white transition")} />
                                <span className="truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="flex-shrink-0 p-5 border-t border-white/5 bg-black/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-xs font-black text-white shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-white truncate">{displayName}</p>
                                {user.is_superadmin && (
                                    <span className="shrink-0 px-1.5 py-0.5 bg-red-900/60 text-red-300 text-[9px] font-black rounded uppercase tracking-wider">GOD</span>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { clearAuth(); router.push('/login'); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-red-900/20 hover:text-red-400 text-xs font-bold transition"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair da Plataforma
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto hide-scrollbar">
                {children}
            </main>
        </div>
    );
}
