'use client';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWide = pathname === '/plans';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 py-12">
      <div className={cn("w-full px-4", isWide ? "max-w-5xl" : "max-w-md")}>
        {children}
      </div>
    </div>
  );
}
