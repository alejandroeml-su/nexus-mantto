import { UserRole } from './types';

export type Permission = 
  | 'view_dashboard'
  | 'view_bitacoras'
  | 'view_activos'
  | 'manage_activos'
  | 'view_mantenimiento'
  | 'manage_mantenimiento'
  | 'view_seguimiento'
  | 'view_configuracion'
  | 'manage_usuarios'
  | 'manage_sedes';

const PERMISSIONS: Record<UserRole, Permission[]> = {
  'SuperAdmin': [
    'view_dashboard', 'view_bitacoras', 'view_activos', 'manage_activos',
    'view_mantenimiento', 'manage_mantenimiento', 'view_seguimiento',
    'view_configuracion', 'manage_usuarios', 'manage_sedes'
  ],
  'Admin': [
    'view_dashboard', 'view_bitacoras', 'view_activos', 'manage_activos',
    'view_mantenimiento', 'manage_mantenimiento', 'view_seguimiento',
    'view_configuracion', 'manage_usuarios', 'manage_sedes'
  ],
  'Jefe': [
    'view_dashboard', 'view_bitacoras', 'view_activos',
    'view_mantenimiento', 'manage_mantenimiento', 'view_seguimiento'
  ],
  'Técnico': [
    'view_dashboard', 'view_bitacoras', 'view_mantenimiento', 'view_seguimiento'
  ]
};

export function hasPermission(role: string, permission: Permission): boolean {
  if (role === 'Super Admin') role = 'SuperAdmin';
  return PERMISSIONS[role as UserRole]?.includes(permission) ?? false;
}

export function getVisibleNavItems(role: UserRole, navItems: any[]) {
  return navItems.filter(item => {
    if (item.permission) {
      return hasPermission(role, item.permission);
    }
    return true;
  });
}
