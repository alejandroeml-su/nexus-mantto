'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import { getSedes, createSede, updateSede, deleteSede } from '@/lib/actions';
import BackButton from '@/components/BackButton';
import styles from './ConfigSedes.module.css';

interface Sede {
  id: string;
  nombre: string;
  direccion: string | null;
}

export default function ConfigSedesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [formData, setFormData] = useState({ nombre: '', direccion: '' });

  useEffect(() => {
    loadSedes();
  }, []);

  async function loadSedes() {
    const data = await getSedes();
    setSedes(data as Sede[]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingSede) {
      await updateSede(editingSede.id, formData.nombre, formData.direccion);
    } else {
      await createSede(formData.nombre, formData.direccion);
    }
    setIsModalOpen(false);
    setEditingSede(null);
    setFormData({ nombre: '', direccion: '' });
    loadSedes();
  }

  function handleEdit(sede: Sede) {
    setEditingSede(sede);
    setFormData({ nombre: sede.nombre, direccion: sede.direccion || '' });
    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (confirm('¿Estás seguro de eliminar esta sede?')) {
      await deleteSede(id);
      loadSedes();
    }
  }

  return (
    <div className="animate-fade-in">
      <BackButton />
      <header className={styles.header}>
        <h1 className={styles.title}>Gestión de Sedes</h1>
        <button className={`${styles.addButton} glass`} onClick={() => {
          setEditingSede(null);
          setFormData({ nombre: '', direccion: '' });
          setIsModalOpen(true);
        }}>
          <Plus size={20} />
          <span>Nueva Sede</span>
        </button>
      </header>

      <div className={styles.grid}>
        {sedes.map((sede) => (
          <div key={sede.id} className={`${styles.card} glass`}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper}><MapPin size={24} /></div>
              <div className={styles.actions}>
                <button className={styles.actionBtn} onClick={() => handleEdit(sede)}><Edit2 size={16} /></button>
                <button className={styles.actionBtn} onClick={() => handleDelete(sede.id)}><Trash2 size={16} /></button>
              </div>
            </div>
            <h3 className={styles.name}>{sede.nombre}</h3>
            <p className={styles.address}>{sede.direccion}</p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass animate-fade-in`}>
            <h2>{editingSede ? 'Editar Sede' : 'Registrar Nueva Sede'}</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Nombre de la Sede</label>
                <input 
                  type="text" 
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Dirección</label>
                <textarea 
                  rows={3} 
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                ></textarea>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Guardar Sede</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
