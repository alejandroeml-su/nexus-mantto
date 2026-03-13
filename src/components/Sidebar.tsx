'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Box, 
  Calendar, 
  Users, 
  Settings, 
  Activity,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { UserRole } from '@/lib/types';
import { hasPermission } from '@/lib/permissions';
import styles from './Sidebar.module.css';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'view_dashboard' },
  { name: 'Bitácoras', href: '/bitacoras', icon: Activity, permission: 'view_bitacoras' },
  { name: 'Activos', href: '/activos', icon: Box, permission: 'view_activos' },
  { name: 'Mantenimiento', href: '/mantenimiento', icon: Calendar, permission: 'view_mantenimiento' },
  { name: 'Seguimiento', href: '/seguimiento', icon: Activity, permission: 'view_seguimiento' },
  { name: 'Configuración', href: '/configuracion/usuarios', icon: Settings, permission: 'view_configuracion' },
];

export default function Sidebar({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>('SuperAdmin');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  // Load role from localStorage for persistence in demo
  useEffect(() => {
    const savedRole = localStorage.getItem('user_role') as UserRole;
    if (savedRole) setRole(savedRole);
  }, []);

  const changeRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('user_role', newRole);
    setIsRoleMenuOpen(false);
    window.location.reload(); // Reload to refresh permissions throughout
  };

  const filteredItems = navItems.filter(item => 
    !item.permission || hasPermission(role, item.permission as any)
  );

  const getRoleColor = (r: string) => {
    switch(r) {
      case 'SuperAdmin': return '#ef4444';
      case 'Admin': return '#3b82f6';
      case 'Jefe': return '#f59e0b';
      case 'Técnico': return '#10b981';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <aside className={`${styles.sidebar} ${mobile ? styles.mobile : ''} glass`}>
      <div className={styles.logo}>
        <Activity size={32} />
        <span>NEXUS 4.0</span>
      </div>

      <nav className={styles.nav}>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.roleSwitcher}>
          <button 
            className={styles.currentRole} 
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
          >
            <div className={styles.avatar} style={{ background: getRoleColor(role) }}>
              {role[0]}
            </div>
            <div className={styles.roleInfo}>
              <span className={styles.userName}>Usuario Demo</span>
              <span className={styles.userRole} style={{ color: getRoleColor(role) }}>
                {role} <ChevronDown size={12} />
              </span>
            </div>
          </button>
          
          {isRoleMenuOpen && (
            <div className={`${styles.roleMenu} glass animate-fade-in`}>
              {(['SuperAdmin', 'Admin', 'Jefe', 'Técnico'] as UserRole[]).map(r => (
                <button key={r} onClick={() => changeRole(r)} className={styles.roleOption}>
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button className={styles.logoutBtn}>
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
