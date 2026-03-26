'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Box } from 'lucide-react';
import { getActivos, createActivo, updateActivo, deleteActivo, getSedes, getAreas, getUbicaciones } from '@/lib/actions';
import { Activo, Sede } from '@/lib/types';
import BackButton from '@/components/BackButton';
import ConfigNav from '@/components/ConfigNav';
import styles from './ConfigActivos.module.css';

export default function ConfigActivosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activos, setActivos] = useState<any[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  
  const [filteredAreas, setFilteredAreas] = useState<any[]>([]);
  const [filteredUbicaciones, setFilteredUbicaciones] = useState<any[]>([]);

  const [editingActivo, setEditingActivo] = useState<any | null>(null);
  const [formData, setFormData] = useState<Partial<Activo>>({
    nombre: '', codigo_activo: '', marca: '', modelo: '', serie: '', anio: new Date().getFullYear(), descripcion: '', 
    sede_id: '', area_id: '', ubicacion_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [a, s, ar, u] = await Promise.all([
      getActivos(), 
      getSedes(),
      getAreas(),
      getUbicaciones()
    ]);
    setActivos(a);
    setSedes(s as Sede[]);
    setAreas(ar);
    setUbicaciones(u);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingActivo) {
        await updateActivo(editingActivo.id, formData);
      } else {
        await createActivo(formData);
      }
      closeModal();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al guardar el activo');
    }
  }

  function handleEdit(activo: any) {
    setEditingActivo(activo);
    setFormData({
      nombre: activo.nombre,
      codigo_activo: activo.codigo_activo || '',
      marca: activo.marca || '',
      modelo: activo.modelo || '',
      serie: activo.serie || '',
      anio: activo.anio || new Date().getFullYear(),
      descripcion: activo.descripcion || '',
      sede_id: activo.sede_id || '',
      area_id: activo.area_id || '',
      ubicacion_id: activo.ubicacion_id || ''
    });

    // Populate filtered lists for editing
    if (activo.sede_id) {
        setFilteredAreas(areas.filter(a => a.sede_id === activo.sede_id));
    }
    if (activo.area_id) {
        setFilteredUbicaciones(ubicaciones.filter(u => u.area_id === activo.area_id));
    }

    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (confirm('¿Eliminar este activo de forma permanente?')) {
      await deleteActivo(id);
      loadData();
    }
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingActivo(null);
    setFormData({ 
      nombre: '', codigo_activo: '', marca: '', modelo: '', serie: '', anio: new Date().getFullYear(), 
      descripcion: '', sede_id: '', area_id: '', ubicacion_id: '' 
    });
    setFilteredAreas([]);
    setFilteredUbicaciones([]);
  }

  // Cascading Logic
  const handleSedeChange = (sedeId: string) => {
    setFormData({ ...formData, sede_id: sedeId, area_id: '', ubicacion_id: '' });
    setFilteredAreas(areas.filter(a => a.sede_id === sedeId));
    setFilteredUbicaciones([]);
  };

  const handleAreaChange = (areaId: string) => {
    setFormData({ ...formData, area_id: areaId, ubicacion_id: '' });
    setFilteredUbicaciones(ubicaciones.filter(u => u.area_id === areaId));
  };

  return (
    <div className="animate-fade-in">
      <BackButton />
      <header className={styles.header} style={{ marginBottom: '15px' }}>
        <div>
          <h1 className={styles.title}>Configuración del Sistema</h1>
          <p className={styles.subtitle} style={{ color: 'var(--text-secondary)' }}>Gestión de catálogos maestros y activos.</p>
        </div>
      </header>
      
      <ConfigNav />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button className={`${styles.addButton} glass`} onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          <span>Registrar Activo</span>
        </button>
      </div>

      <section className={`${styles.actionBar} glass`}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input type="text" placeholder="Buscar por código o serie..." className={styles.searchInput} />
        </div>
      </section>

      <div className={`${styles.tableWrapper} glass`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Activo</th>
              <th>Sede / Área / Ubicación</th>
              <th>Marca / Modelo</th>
              <th>Año</th>
              <th>Serie</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {activos.map((activo) => (
              <tr key={activo.id}>
                <td><code>{activo.codigo_activo || 'N/A'}</code></td>
                <td>{activo.nombre}</td>
                <td style={{fontSize: '0.75rem'}}>
                    <div style={{fontWeight: 'bold'}}>{activo.sede_nombre || '---'}</div>
                    <div style={{opacity: 0.8}}>{activo.area_nombre || '---'}</div>
                    <div style={{opacity: 0.6}}>{activo.ubicacion_nombre || '---'}</div>
                 </td>
                <td>{activo.marca} / {activo.modelo}</td>
                <td>{activo.anio}</td>
                <td>{activo.serie}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => handleEdit(activo)}><Edit2 size={16} /></button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(activo.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass animate-fade-in`}>
            <h2>{editingActivo ? 'Editar Activo' : 'Registrar Nuevo Activo'}</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Nombre del Activo</label>
                  <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Código de Activo</label>
                  <input type="text" value={formData.codigo_activo} onChange={e => setFormData({...formData, codigo_activo: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Marca</label>
                  <input type="text" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Modelo</label>
                  <input type="text" value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Año</label>
                  <input type="number" value={formData.anio} onChange={e => setFormData({...formData, anio: parseInt(e.target.value)})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Número de Serie</label>
                  <input type="text" value={formData.serie} onChange={e => setFormData({...formData, serie: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                   <label>Sede</label>
                   <select value={formData.sede_id} onChange={e => handleSedeChange(e.target.value)}>
                     <option value="">Seleccionar Sede</option>
                     {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                   </select>
                 </div>
                 <div className={styles.formGroup}>
                   <label>Área</label>
                   <select value={formData.area_id} onChange={e => handleAreaChange(e.target.value)} disabled={!formData.sede_id}>
                     <option value="">Seleccionar Área</option>
                     {filteredAreas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                   </select>
                 </div>
                 <div className={styles.formGroup}>
                   <label>Ubicación</label>
                   <select value={formData.ubicacion_id} onChange={e => setFormData({...formData, ubicacion_id: e.target.value})} disabled={!formData.area_id}>
                     <option value="">Seleccionar Ubicación</option>
                     {filteredUbicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                   </select>
                 </div>
              </div>
              <div className={styles.formGroup}>
                <label>Descripción</label>
                <textarea rows={3} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})}></textarea>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={closeModal} className={styles.cancelBtn}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Guardar Activo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
