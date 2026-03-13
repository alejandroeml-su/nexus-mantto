'use client';

import React, { useState, useEffect } from 'react';
import { Plus, User, Calendar, ClipboardList, PenTool, Paperclip, AlertCircle } from 'lucide-react';
import { getMantenimientos, getActivos, getUsuarios, scheduleMantenimiento } from '@/lib/actions';
import BackButton from '@/components/BackButton';
import styles from './Ordenes.module.css';

export default function OrdenesTrabajoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [activos, setActivos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ 
    activo_id: '', 
    tipo: 'Preventivo', 
    descripcion: '', 
    fecha_programada: new Date().toISOString().split('T')[0], 
    tecnico_id: '',
    prioridad: 'Media'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [o, a, u] = await Promise.all([getMantenimientos(), getActivos(), getUsuarios()]);
    setOrdenes(o);
    setActivos(a);
    setUsuarios(u.filter(user => user.rol === 'Técnico'));
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await scheduleMantenimiento({
      ...formData,
      tipo: formData.tipo as any,
      fecha_programada: new Date(formData.fecha_programada),
      prioridad: formData.prioridad as any
    });
    setIsModalOpen(false);
    setSelectedFile(null);
    loadData();
  }

  const getPriorityClass = (priority: string) => {
    switch(priority) {
      case 'Crítica': return styles.priorityCritica;
      case 'Alta': return styles.priorityAlta;
      case 'Media': return styles.priorityMedia;
      default: return styles.priorityBaja;
    }
  };

  return (
    <div className="animate-fade-in">
      <BackButton />
      <header className={styles.header}>
        <h1 className={styles.title}>Órdenes de Trabajo (OT)</h1>
        <button className={`${styles.addButton} glass`} onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          <span>Nueva OT</span>
        </button>
      </header>

      <div className={styles.statsRow}>
        <div className={`${styles.miniStat} glass`}><span>Pendientes</span> <strong>{ordenes.filter(o => o.estado === 'Programado').length}</strong></div>
        <div className={`${styles.miniStat} glass`}><span>En Proceso</span> <strong>{ordenes.filter(o => o.estado === 'En Proceso').length}</strong></div>
        <div className={`${styles.miniStat} glass`}><span>Completadas</span> <strong>{ordenes.filter(o => o.estado === 'Completado').length}</strong></div>
      </div>

      <div className={styles.orderList}>
        {ordenes.map((ot) => (
          <div key={ot.id} className={`${styles.otCard} glass`}>
            <div className={styles.otHeader}>
              <div className={styles.idWithPriority}>
                <span className={styles.otId}>OT-{ot.id.split('-')[0].toUpperCase()}</span>
                <span className={`${styles.priorityBadge} ${getPriorityClass(ot.prioridad)}`}>
                  {ot.prioridad}
                </span>
              </div>
              <span className={`${styles.statusBadge} ${ot.estado === 'Programado' ? styles.statusInfo : styles.statusAlert}`}>
                {ot.estado}
              </span>
            </div>
            <div className={styles.otBody}>
              <h3 className={styles.assetName}>{ot.activo_nombre}</h3>
              <p className={styles.otType}>{ot.tipo}</p>
              <p className={styles.otDesc}>{ot.descripcion}</p>
            </div>
            <div className={styles.otFooter}>
              <div className={styles.meta}>
                <Calendar size={14} /> <span>{new Date(ot.fecha_programada).toLocaleDateString()}</span>
              </div>
              <div className={styles.meta}>
                <User size={14} /> <span>{ot.tecnico_nombre || 'Sin Asignar'}</span>
              </div>
              <button className={styles.assignBtn}>
                <PenTool size={14} />
                <span>Asignar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass animate-fade-in`}>
            <h2>Programar Orden de Trabajo</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Seleccionar Activo</label>
                <select value={formData.activo_id} onChange={e => setFormData({...formData, activo_id: e.target.value})} required>
                  <option value="">Seleccionar...</option>
                  {activos.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.codigo_activo})</option>)}
                </select>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Tipo de Mantenimiento</label>
                  <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                    <option value="Preventivo">Preventivo</option>
                    <option value="Correctivo">Correctivo</option>
                    <option value="Predictivo">Predictivo</option>
                    <option value="Inspección">Inspección</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Prioridad</label>
                  <select value={formData.prioridad} onChange={e => setFormData({...formData, prioridad: e.target.value})}>
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Fecha Programada</label>
                  <input type="date" value={formData.fecha_programada} onChange={e => setFormData({...formData, fecha_programada: e.target.value})} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Asignar Técnico</label>
                  <select value={formData.tecnico_id} onChange={e => setFormData({...formData, tecnico_id: e.target.value})}>
                    <option value="">Sin Asignar</option>
                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Descripción del Trabajo</label>
                <textarea rows={3} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} required></textarea>
              </div>
              
              <div className={styles.formGroup}>
                <label>Adjuntos Multimedia</label>
                <div className={styles.fileDropzone}>
                  <Paperclip size={24} />
                  <div className={styles.fileLabel}>
                    {selectedFile ? (
                      <span>{selectedFile.name}</span>
                    ) : (
                      <>
                        <span>Subir evidencia técnica</span>
                        <p>Imágenes o documentos PDF</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    className={styles.fileInput} 
                    onChange={handleFileChange} 
                    accept="image/*,application/pdf"
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Crear Orden</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
