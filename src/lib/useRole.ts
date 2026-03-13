'use client';

import { useState, useEffect } from 'react';
import { UserRole } from './types';
import { Permission, hasPermission as checkPermission } from './permissions';

export function useRole() {
  const [role, setRole] = useState<UserRole>('SuperAdmin');

  useEffect(() => {
    const savedRole = localStorage.getItem('user_role') as UserRole;
    if (savedRole) setRole(savedRole);
  }, []);

  const hasPermission = (permission: Permission) => {
    return checkPermission(role, permission);
  };

  return { role, hasPermission };
}
