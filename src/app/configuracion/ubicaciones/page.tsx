'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Globe } from 'lucide-react';
import { getSedes, createSede, updateSede, deleteSede, getPaises, createPais, updatePais, deletePais } from '@/lib/actions';
import BackButton from '@/components/BackButton';
import ConfigNav from '@/components/ConfigNav';
import styles from './ConfigSedes.module.css';

interface Pais {
  id: string;
  nombre: string;
  codigo: string | null;
}

interface Sede {
  id: string;
  nombre: string;
  direccion: string | null;
  pais_id: string | null;
  pais_nombre?: string;
}

export default function ConfigUbicacionesPage() {
  const [activeTab, setActiveTab] = useState<'paises' | 'sedes'>('paises');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaisModalOpen, setIsPaisModalOpen] = useState(false);
  
  const [paises, setPaises] = useState<Pais[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  
  const [editingPais, setEditingPais] = useState<Pais | null>(null);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  
  const [paisFormData, setPaisFormData] = useState({ nombre: '', codigo: '' });
  const [sedeFormData, setSedeFormData] = useState({ nombre: '', direccion: '', pais_id: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [p, s] = await Promise.all([getPaises(), getSedes()]);
    setPaises(p as Pais[]);
    setSedes(s as Sede[]);
  }

  // --- Pais Functions ---
  async function handlePaisSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingPais) {
        await updatePais(editingPais.id, paisFormData.nombre, paisFormData.codigo);
        alert('País actualizado con éxito');
      } else {
        await createPais(paisFormData.nombre, paisFormData.codigo);
        alert('País registrado con éxito');
      }
      setIsPaisModalOpen(false);
      setPaisFormData({ nombre: '', codigo: '' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al guardar el país');
    }
  }

  function handlePaisEdit(pais: Pais) {
    setEditingPais(pais);
    setPaisFormData({ nombre: pais.nombre, codigo: pais.codigo || '' });
    setIsPaisModalOpen(true);
  }

  async function handlePaisDelete(id: string) {
    try {
        if (confirm('¿Estás seguro de eliminar este país?')) {
          await deletePais(id);
          loadData();
        }
    } catch (e: any) {
        alert(e.message);
    }
  }

  // --- Sede Functions ---
  async function handleSedeSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingSede) {
        await updateSede(editingSede.id, sedeFormData.nombre, sedeFormData.direccion, sedeFormData.pais_id);
        alert('Sede actualizada con éxito');
      } else {
        await createSede(sedeFormData.nombre, sedeFormData.direccion, sedeFormData.pais_id);
        alert('Sede registrada con éxito');
      }
      setIsModalOpen(false);
      setSedeFormData({ nombre: '', direccion: '', pais_id: '' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al guardar la sede');
    }
  }

  function handleSedeEdit(sede: Sede) {
    setEditingSede(sede);
    setSedeFormData({ nombre: sede.nombre, direccion: sede.direccion || '', pais_id: sede.pais_id || '' });
    setIsModalOpen(true);
  }

  async function handleSedeDelete(id: string) {
    if (confirm('¿Estás seguro de eliminar esta sede?')) {
      await deleteSede(id);
      loadData();
    }
  }

  return (
    <div className="animate-fade-in">
      <BackButton />
      
      <header className={styles.header} style={{ marginBottom: '15px' }}>
        <h1 className={styles.title}>Configuración del Sistema</h1>
        <p className={styles.subtitle}>Gestión de identidades, ubicaciones regionales y activos.</p>
      </header>

      <ConfigNav />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className={styles.tabs} style={{ display: 'flex', gap: '10px' }}>
            <button 
                className={`${styles.tab} ${activeTab === 'paises' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('paises')}
                style={{ padding: '8px 16px', background: activeTab === 'paises' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', color: activeTab === 'paises' ? 'white' : 'var(--text-secondary)' }}
            >
                Países
            </button>
            <button 
                className={`${styles.tab} ${activeTab === 'sedes' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('sedes')}
                style={{ padding: '8px 16px', background: activeTab === 'sedes' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', color: activeTab === 'sedes' ? 'white' : 'var(--text-secondary)' }}
            >
                Sedes
            </button>
          </div>
          
          {activeTab === 'paises' && (
              <button className={`${styles.addButton} glass`} onClick={() => { setEditingPais(null); setPaisFormData({ nombre: '', codigo: '' }); setIsPaisModalOpen(true); }}>
                <Plus size={20} /> <span>Nuevo País</span>
              </button>
          )}

          {activeTab === 'sedes' && (
              <button className={`${styles.addButton} glass`} onClick={() => { setEditingSede(null); setSedeFormData({ nombre: '', direccion: '', pais_id: '' }); setIsModalOpen(true); }}>
                <Plus size={20} /> <span>Nueva Sede</span>
              </button>
          )}
      </div>

      {activeTab === 'paises' && (
          <div className={styles.grid}>
            {paises.map((pais) => (
              <div key={pais.id} className={`${styles.card} glass`}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrapper}><Globe size={24} /></div>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} onClick={() => handlePaisEdit(pais)}><Edit2 size={16} /></button>
                    <button className={styles.actionBtn} onClick={() => handlePaisDelete(pais.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
                <h3 className={styles.name}>{pais.nombre}</h3>
                <p className={styles.address}>Cód: {pais.codigo || 'N/A'}</p>
              </div>
            ))}
            {paises.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No hay países registrados.</p>}
          </div>
      )}

      {activeTab === 'sedes' && (
          <div className={styles.grid}>
            {sedes.map((sede) => (
              <div key={sede.id} className={`${styles.card} glass`}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrapper}><MapPin size={24} /></div>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} onClick={() => handleSedeEdit(sede)}><Edit2 size={16} /></button>
                    <button className={styles.actionBtn} onClick={() => handleSedeDelete(sede.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
                <h3 className={styles.name}>{sede.nombre}</h3>
                <p className={styles.address}>
                    <strong>{sede.pais_nombre || 'Sin país'}</strong> <br/>
                    {sede.direccion}
                </p>
              </div>
            ))}
            {sedes.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No hay sedes registradas.</p>}
          </div>
      )}

      {isPaisModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass animate-fade-in`}>
            <h2>{editingPais ? 'Editar País' : 'Registrar Nuevo País'}</h2>
            <form className={styles.form} onSubmit={handlePaisSubmit}>
              <div className={styles.formGroup}>
                <label>Nombre del País</label>
                <input type="text" value={paisFormData.nombre} onChange={(e) => setPaisFormData({...paisFormData, nombre: e.target.value})} required />
              </div>
              <div className={styles.formGroup}>
                <label>Código Interno (Opcional)</label>
                <input type="text" maxLength={10} value={paisFormData.codigo} onChange={(e) => setPaisFormData({...paisFormData, codigo: e.target.value})} />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsPaisModalOpen(false)} className={styles.cancelBtn}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Guardar País</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass animate-fade-in`}>
            <h2>{editingSede ? 'Editar Sede' : 'Registrar Nueva Sede'}</h2>
            <form className={styles.form} onSubmit={handleSedeSubmit}>
              <div className={styles.formGroup}>
                <label>Nombre de la Sede</label>
                <input type="text" value={sedeFormData.nombre} onChange={(e) => setSedeFormData({...sedeFormData, nombre: e.target.value})} required />
              </div>
              <div className={styles.formGroup}>
                <label>País</label>
                <select value={sedeFormData.pais_id} onChange={(e) => setSedeFormData({...sedeFormData, pais_id: e.target.value})} required>
                  <option value="">Seleccionar país...</option>
                  {paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Dirección</label>
                <textarea rows={3} value={sedeFormData.direccion} onChange={(e) => setSedeFormData({...sedeFormData, direccion: e.target.value})}></textarea>
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
