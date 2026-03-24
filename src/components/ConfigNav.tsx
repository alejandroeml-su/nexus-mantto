'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, MapPin, Database } from 'lucide-react';
import styles from './ConfigNav.module.css';
import { useRole } from '@/lib/useRole';

export default function ConfigNav() {
  const pathname = usePathname();
  const { role } = useRole();
  
  const navItems = [
    { name: 'Usuarios y Roles', href: '/configuracion/usuarios', icon: Users, show: role === 'SuperAdmin' || role === 'Admin' },
    { name: 'Países y Sedes', href: '/configuracion/ubicaciones', icon: MapPin, show: true },
    { name: 'Catálogos de Activos', href: '/configuracion/activos', icon: Database, show: true },
  ];

  return (
    <div className={`${styles.configNav} glass`}>
      {navItems.filter(item => item.show).map(item => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
             <Icon size={18} />
             <span>{item.name}</span>
          </Link>
        )
      })}
    </div>
  );
}
