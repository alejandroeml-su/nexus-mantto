'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Mail, Edit, Trash2, Key, Check, X } from 'lucide-react';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '@/lib/actions';
import { useRole } from '@/lib/useRole';
import BackButton from '@/components/BackButton';
import ConfigNav from '@/components/ConfigNav';
import styles from './ConfigUsuarios.module.css';

export default function ConfigUsuariosPage() {
  const { role, hasPermission } = useRole();
  const [activeTab, setActiveTab] = useState<'usuarios' | 'roles'>(role === 'SuperAdmin' ? 'usuarios' : 'roles');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState({ nombre: '', email: '', rol: 'Técnico', departamento_id: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsuarios();
  }, []);

  async function loadUsuarios() {
    const data = await getUsuarios();
    setUsuarios(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editingUser) {
        await updateUsuario(editingUser.id, formData);
      } else {
        await createUsuario(formData);
      }
      closeModal();
      loadUsuarios();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el usuario');
    }
  }

  function handleEdit(user: any) {
    setEditingUser(user);
    setFormData({ nombre: user.nombre, email: user.email, rol: user.rol === 'SuperAdmin' ? 'Super Admin' : user.rol, departamento_id: user.departamento_id || '', password: '' });
    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      if (confirm('¿Eliminar este usuario?')) {
        await deleteUsuario(id);
        loadUsuarios();
      }
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ nombre: '', email: '', rol: 'Técnico', departamento_id: '', password: '' });
    setError('');
  }

  if (!hasPermission('manage_usuarios') && role !== 'SuperAdmin') {
    return <div className="p-8">No tienes permiso para acceder a esta sección.</div>;
  }

  return (
    <div className="animate-fade-in">
      <BackButton />
      
      <header className={styles.header} style={{ marginBottom: '15px' }}>
        <div>
          <h1 className={styles.title}>Configuración del Sistema</h1>
          <p className={styles.subtitle}>Gestión de identidades, accesos y permisos globales.</p>
        </div>
      </header>
      
      <ConfigNav />

      <div className={styles.tabActions}>
        <div className={styles.tabs}>
            {role === 'SuperAdmin' && (
              <button 
                className={`${styles.tab} ${activeTab === 'usuarios' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('usuarios')}
              >
                Usuarios
              </button>
            )}
            <button 
              className={`${styles.tab} ${activeTab === 'roles' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('roles')}
            >
              Roles y Permisos
            </button>
          </div>
          {activeTab === 'usuarios' && (
            <button className={`${styles.addButton} glass`} onClick={() => setIsModalOpen(true)}>
              <UserPlus size={20} />
              <span>Registrar Usuario</span>
            </button>
          )}
        </div>

      {activeTab === 'usuarios' ? (
        <div className={styles.userGrid}>
          {usuarios.map((user) => (
            <div key={user.id} className={`${styles.userCard} glass`}>
              <div className={styles.avatar}>{user.nombre.charAt(0)}</div>
              <div className={styles.userInfo}>
                <h3 className={styles.userName}>{user.nombre}</h3>
                <div className={styles.userEmail}><Mail size={14} /> {user.email}</div>
                <div className={styles.userRole}>
                  <Shield size={14} /> 
                  <span className={`${styles.roleBadge} ${styles[user.rol.toLowerCase()] || ''}`}>{user.rol}</span>
                </div>
              </div>
              <div className={styles.userFooter}>
                <span>Departamento: {user.depto_nombre || 'General'}</span>
                <div className={styles.rowActions}>
                  <button className={styles.editBtn} onClick={() => handleEdit(user)} title="Editar"><Edit size={16} /></button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(user.id)} title="Eliminar"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${styles.rolesSection} glass`}>
          <div className={styles.rolesHeader}>
            <Key size={24} className={styles.roleIcon} />
            <h2>Matriz de Permisos por Rol</h2>
          </div>
          <p className={styles.rolesDesc}>Define y visualiza los niveles de acceso para cada jerarquía en NEXUS 4.0</p>
          
          <div className={styles.rolesTableWrapper}>
            <table className={styles.rolesTable}>
              <thead>
                <tr>
                  <th>Permiso / Funcionalidad</th>
                  <th>SuperAdmin</th>
                  <th>Admin</th>
                  <th>Jefe</th>
                  <th>Técnico</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Dashboard General</td>
                  <td><Check size={18} className={styles.check} /></td>
                  <td><Check size={18} className={styles.check} /></td>
                  <td><Check size={18} className={styles.check} /></td>
                  <td><Check size={18} className={styles.check} /></td>
                </tr>
                <tr>
                  <td>Gestión de Activos (CRUD)</td>
                  <td><Check size={18} className={styles.check} /></td>
                  <td><Check size={18} className={styles.check} /></td>
                  <td><Check size={18} className={styles.check} /></td>
                  <td><X size={18} className={styles.cross} /></td>
                </tr>
                <tr>
                  <td>Programación de OTs</td>
                  <td><Check size={18} className={styles.check} /></td>
                  <td><Check size={18} className={styles.check} /></td>
                  <td><Check size={18} className={styles.check} /></td>
                  <td><X size={18} className={styles.cross} /></td>
                </tr>
                <tr>
                  <td>Cerrar Bitácoras</td>
                  <td><Check size={18} className={styles.check} /></td>
                  <td><Check size={18} className={styles.check} /></td>
                  <td><Check size={18} className={styles.check} /></td>
                  <td><Check size={18} className={styles.check} /></td>
                </tr>
                <tr>
                  <td>Configuración Global (Sedes/Usuarios)</td>
                  <td><Check size={18} className={styles.check} /></td>
                  <td><Check size={18} className={styles.check} /></td>
                  <td><X size={18} className={styles.cross} /></td>
                  <td><X size={18} className={styles.cross} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass animate-fade-in`}>
            <h2>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200">
                {error}
              </div>
            )}
            
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Nombre Completo</label>
                <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Juan Pérez" required />
              </div>
              <div className={styles.formGroup}>
                <label>Correo Electrónico</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="correo@empresa.com" required />
              </div>
              {!editingUser && (
                <div className={styles.formGroup}>
                  <label>Contraseña</label>
                  <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Contraseña inicial" required />
                </div>
              )}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Rol de Acceso</label>
                  <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})}>
                    <option value="Técnico">Técnico</option>
                    <option value="Jefe">Jefe</option>
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={closeModal} className={styles.cancelBtn}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>{editingUser ? 'Guardar Cambios' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
