'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore();
    const branding = user?.company?.branding;

    useEffect(() => {
        if (branding) {
            // Aplicar cores primárias
            if (branding.primary_color) {
                document.documentElement.style.setProperty('--brand-primary', branding.primary_color);
            } else {
                document.documentElement.style.removeProperty('--brand-primary');
            }

            // Aplicar cores secundárias
            if (branding.secondary_color) {
                document.documentElement.style.setProperty('--brand-secondary', branding.secondary_color);
            } else {
                document.documentElement.style.removeProperty('--brand-secondary');
            }

            // Alterar Favicon se existir
            if (branding.favicon_url) {
                let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.getElementsByTagName('head')[0].appendChild(link);
                }
                link.href = branding.favicon_url;
            }
        }
    }, [branding]);

    return <>{children}</>;
}
