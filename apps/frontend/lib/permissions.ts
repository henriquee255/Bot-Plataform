export type Role = 'agent' | 'supervisor' | 'manager' | 'admin' | 'superadmin';

export const PERMISSIONS = {
    VIEW_INBOX: ['agent', 'supervisor', 'manager', 'admin'],
    VIEW_DASHBOARD: ['agent', 'supervisor', 'manager', 'admin'],
    MANAGE_AGENTS: ['supervisor', 'manager', 'admin'],
    MANAGE_COMPANY: ['admin'],
    MANAGE_SECTORS: ['manager', 'admin'],
    VIEW_ADMIN_PANEL: ['superadmin'],
};

export function hasPermission(role: string, permission: keyof typeof PERMISSIONS, isSuperadmin = false): boolean {
    if (isSuperadmin) return true;
    const allowedRoles = PERMISSIONS[permission] || [];
    return allowedRoles.includes(role);
}
