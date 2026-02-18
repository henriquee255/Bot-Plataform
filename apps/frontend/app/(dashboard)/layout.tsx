'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { SocketProvider } from '@/components/socket-provider';
import { BrandingProvider } from '@/components/branding-provider';
import {
  MessageSquare, LayoutDashboard, Settings, LogOut, Users, Shield,
  UserCircle, Shapes, BookOpen, Bot, Zap, GitBranch, Lock, Kanban,
  Timer, BarChart2, ChevronLeft, ChevronRight, Sun, Moon, Monitor,
  Menu, X,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { hasPermission } from '@/lib/permissions';

type Theme = 'light' | 'dark';

function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem('app-theme') as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('app-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return { theme, toggle };
}

function Sidebar({
  expanded,
  setExpanded,
  mobileOpen,
  setMobileOpen,
}: {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const { user, clearAuth } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();

  function logout() {
    localStorage.clear();
    clearAuth();
    router.push('/login');
  }

  // Fecha sidebar mobile ao navegar
  useEffect(() => {
    setMobileOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Painel', permission: 'VIEW_DASHBOARD' },
    { href: '/inbox', icon: MessageSquare, label: 'Inbox', permission: 'VIEW_INBOX' },
    { href: '/contacts', icon: Users, label: 'Contatos', permission: 'VIEW_INBOX' },
    { href: '/crm', icon: Kanban, label: 'CRM', permission: 'VIEW_INBOX' },
    { href: '/reports', icon: BarChart2, label: 'Relatorios', permission: 'VIEW_DASHBOARD' },
    { href: '/knowledge-base', icon: BookOpen, label: 'Base de Conhecimento', permission: 'VIEW_DASHBOARD' },
    { href: '/settings/automations', icon: Timer, label: 'Automacoes', permission: 'MANAGE_COMPANY' },
    { href: '/settings/bot', icon: Bot, label: 'Bot & Fluxos', permission: 'MANAGE_COMPANY' },
    { href: '/settings/quick-replies', icon: Zap, label: 'Respostas Rapidas', permission: 'MANAGE_COMPANY' },
    { href: '/settings/channels', icon: GitBranch, label: 'Canais', permission: 'MANAGE_COMPANY' },
    { href: '/settings/sectors', icon: Shapes, label: 'Setores', permission: 'MANAGE_SECTORS' },
    { href: '/settings/agents', icon: Shield, label: 'Equipe', permission: 'MANAGE_AGENTS' },
    { href: '/settings/widget', icon: Settings, label: 'Configuracoes', permission: 'MANAGE_COMPANY' },
  ].filter(item => !item.permission || (user && hasPermission(user.role, item.permission as any, user.is_superadmin)));

  const adminItem = user?.is_superadmin
    ? { href: '/admin/dashboard', icon: Monitor, label: 'Admin Panel' }
    : null;

  const platformName = user?.company?.branding?.company_name || 'ChatPlatform';
  const logoUrl = user?.company?.branding?.logo_url;

  // Em desktop: usa `expanded` (colapsado/expandido)
  // Em mobile:  a sidebar é sempre "expandida" quando visível, controlada por mobileOpen
  const sidebarContent = (isMobile: boolean) => (
    <div className={cn(
      'flex flex-col h-full bg-[#1e1f2e] border-r border-white/5',
      isMobile ? 'w-64' : (expanded ? 'w-56' : 'w-16'),
    )}>
      {/* Logo + Nome */}
      <div className={cn(
        'flex items-center gap-3 px-3 py-4 shrink-0',
        isMobile || expanded ? 'justify-start' : 'justify-center',
      )}>
        <Link
          href="/dashboard"
          className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 overflow-hidden shrink-0"
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <MessageSquare className="w-5 h-5 text-white" />
          )}
        </Link>
        {(isMobile || expanded) && (
          <div className="flex flex-col min-w-0">
            <span className="text-white text-sm font-bold truncate">{platformName}</span>
            <span className="text-gray-500 text-[10px]">Atendimento</span>
          </div>
        )}

        {/* Botao fechar no mobile */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Toggle expand button — apenas desktop */}
      {!isMobile && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'absolute -right-3 top-14 w-6 h-6 rounded-full bg-[#1e1f2e] border border-white/10',
            'flex items-center justify-center text-gray-400 hover:text-white transition z-10 shadow-md',
          )}
        >
          {expanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Nav items — scrollable */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const showLabel = isMobile || expanded;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!showLabel ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl transition-all duration-150',
                  showLabel ? 'px-3 py-2.5' : 'w-10 h-10 justify-center mx-auto',
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white',
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {showLabel && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
              </Link>
            );
          })}

          {adminItem && (
            <>
              <div className="my-1 border-t border-white/5" />
              <Link
                href={adminItem.href}
                title={!(isMobile || expanded) ? adminItem.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl transition-all duration-150',
                  (isMobile || expanded) ? 'px-3 py-2.5' : 'w-10 h-10 justify-center mx-auto',
                  pathname.startsWith(adminItem.href)
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                    : 'text-red-400 hover:bg-red-500/10 hover:text-red-300',
                )}
              >
                <adminItem.icon className="w-5 h-5 shrink-0" />
                {(isMobile || expanded) && (
                  <span className="text-sm font-medium truncate">{adminItem.label}</span>
                )}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Bottom: Theme toggle + Profile + Logout */}
      <div className="shrink-0 border-t border-white/5 px-2 py-3 flex flex-col gap-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
          className={cn(
            'flex items-center gap-3 rounded-xl transition-all duration-150 text-gray-400 hover:bg-white/10 hover:text-white',
            (isMobile || expanded) ? 'px-3 py-2.5' : 'w-10 h-10 justify-center mx-auto',
          )}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 shrink-0" />
          ) : (
            <Sun className="w-4 h-4 shrink-0" />
          )}
          {(isMobile || expanded) && <span className="text-sm font-medium">{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>}
        </button>

        {/* Profile */}
        <Link
          href="/settings/profile"
          title={!(isMobile || expanded) ? 'Meu Perfil' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-xl transition-all duration-150',
            (isMobile || expanded) ? 'px-3 py-2.5' : 'w-10 h-10 justify-center mx-auto',
            pathname.startsWith('/settings/profile')
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:bg-white/10 hover:text-white',
          )}
        >
          <UserCircle className="w-5 h-5 shrink-0" />
          {(isMobile || expanded) && <span className="text-sm font-medium truncate">Meu Perfil</span>}
        </Link>

        {/* Logout */}
        <button
          onClick={logout}
          title={!(isMobile || expanded) ? 'Sair' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-xl transition-all duration-150 text-gray-400 hover:bg-red-500/10 hover:text-red-400',
            (isMobile || expanded) ? 'px-3 py-2.5 w-full' : 'w-10 h-10 justify-center mx-auto',
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(isMobile || expanded) && <span className="text-sm font-medium">Sair</span>}
        </button>

        {/* User avatar */}
        {(isMobile || expanded) ? (
          <div className="flex items-center gap-3 px-3 py-2 mt-1 rounded-xl bg-white/5">
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-white/10">
              {user ? getInitials(user.fullName) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{user?.fullName}</div>
              <div className="text-gray-500 text-[10px] truncate capitalize">{user?.role}</div>
            </div>
          </div>
        ) : (
          <div className="w-7 h-7 mx-auto rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/10">
            {user ? getInitials(user.fullName) : '?'}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar (fixo, sempre visivel) ── */}
      <aside
        className={cn(
          'hidden md:flex fixed left-0 top-0 h-full flex-col z-50 transition-all duration-300 ease-in-out',
          expanded ? 'w-56' : 'w-16',
        )}
      >
        {sidebarContent(false)}
      </aside>

      {/* ── Mobile sidebar (drawer) ── */}
      <>
        {/* Overlay escuro */}
        <div
          className={cn(
            'md:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-300',
            mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          )}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

        {/* Drawer */}
        <aside
          className={cn(
            'md:hidden fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {sidebarContent(true)}
        </aside>
      </>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [showPlanGate, setShowPlanGate] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setHydrated(true);
    const saved = localStorage.getItem('sidebar-expanded');
    if (saved !== null) setExpanded(saved === 'true');
  }, []);

  function handleSetExpanded(v: boolean) {
    setExpanded(v);
    localStorage.setItem('sidebar-expanded', String(v));
  }

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    const isPaid = ['monthly', 'annual', 'lifetime'].includes(user.company?.plan || '');
    const isRestrictedPath = pathname.startsWith('/inbox') || pathname.startsWith('/contacts');
    if (isRestrictedPath && !isPaid && !user.is_superadmin) {
      setShowPlanGate(true);
      router.back();
    }
  }, [user, hydrated, pathname, router]);

  if (!hydrated || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1e1f2e]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const showUpgradeBanner = !user.is_superadmin && user.company?.plan === 'free' && pathname === '/dashboard';
  // Em desktop: margem baseada no estado expanded/collapsed
  // Em mobile: sem margem (sidebar e overlay flutuam sobre o conteudo)
  const sidebarWidth = expanded ? 'md:ml-56' : 'md:ml-16';

  return (
    <BrandingProvider>
      <SocketProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar
            expanded={expanded}
            setExpanded={handleSetExpanded}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />

          <main className={cn(
            'relative flex-1 overflow-hidden bg-white flex flex-col transition-all duration-300',
            sidebarWidth,
          )}>
            {/* ── Topbar mobile com hamburger ── */}
            <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#1e1f2e] border-b border-white/5 shrink-0 z-30">
              <button
                onClick={() => setMobileOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center overflow-hidden">
                  {user?.company?.branding?.logo_url ? (
                    <img src={user.company.branding.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-white text-sm font-bold">
                  {user?.company?.branding?.company_name || 'ChatPlatform'}
                </span>
              </div>
            </div>

            {showUpgradeBanner && (
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-white text-sm font-medium flex items-center justify-between shadow-lg z-[100]">
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Atencao</span>
                  <span className="hidden sm:inline">Seu plano atual nao permite o uso do atendimento em tempo real.</span>
                  <span className="sm:hidden text-xs">Plano gratuito — recursos limitados.</span>
                </div>
                <Link href="/plans" className="bg-white text-indigo-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-100 transition shrink-0">
                  Assinar
                </Link>
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              {children}
            </div>

            {showPlanGate && (
              <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                  <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-7 h-7 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Recurso Premium</h2>
                  <p className="text-gray-500 text-sm mb-6">Esta funcionalidade requer um plano pago. Assine agora para usar o inbox e gerenciar contatos.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPlanGate(false)}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-xl text-sm hover:bg-gray-50"
                    >
                      Voltar
                    </button>
                    <Link
                      href="/plans"
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 text-center"
                    >
                      Ver Planos
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </SocketProvider>
    </BrandingProvider>
  );
}
