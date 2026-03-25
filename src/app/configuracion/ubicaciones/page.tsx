'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Globe, Layout, Map } from 'lucide-react';
import { 
  getSedes, createSede, updateSede, deleteSede, 
  getPaises, createPais, updatePais, deletePais,
  getAreas, createArea, updateArea, deleteArea,
  getUbicaciones, createUbicacion, updateUbicacion, deleteUbicacion
} from '@/lib/actions';
import BackButton from '@/components/BackButton';
import ConfigNav from '@/components/ConfigNav';
import styles from './ConfigSedes.module.css';

interface Pais { id: string; nombre: string; codigo: string | null; }
interface Sede { id: string; nombre: string; direccion: string | null; pais_id: string | null; pais_nombre?: string; }
interface Area { id: string; nombre: string; sede_id: string; sede_nombre?: string; activo: boolean; }
interface Ubicacion { id: string; nombre: string; area_id: string; area_nombre?: string; sede_nombre?: string; activo: boolean; }

type TabType = 'paises' | 'sedes' | 'areas' | 'ubicaciones';

export default function ConfigUbicacionesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('paises');
  
  const [paises, setPaises] = useState<Pais[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  
  // Modals Visibility
  const [isModalOpen, setIsModalOpen] = useState(false); // Used for Sede, Area, Ubicacion
  const [isPaisModalOpen, setIsPaisModalOpen] = useState(false);
  
  // Selection for editing
  const [editingItem, setEditingItem] = useState<any | null>(null);
  
  // Form Data
  const [paisForm, setPaisForm] = useState({ nombre: '', codigo: '' });
  const [sedeForm, setSedeForm] = useState({ nombre: '', direccion: '', pais_id: '' });
  const [areaForm, setAreaForm] = useState({ nombre: '', sede_id: '', activo: true });
  const [uForm, setUForm] = useState({ nombre: '', area_id: '', activo: true });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [p, s, a, u] = await Promise.all([getPaises(), getSedes(), getAreas(), getUbicaciones()]);
    setPaises(p as Pais[]);
    setSedes(s as Sede[]);
    setAreas(a as Area[]);
    setUbicaciones(u as Ubicacion[]);
  }

  // --- Submits ---
  const handlePaisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) await updatePais(editingItem.id, paisForm.nombre, paisForm.codigo || '');
      else await createPais(paisForm.nombre, paisForm.codigo || '');
      alert('País guardado');
      setIsPaisModalOpen(false);
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleSedeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) await updateSede(editingItem.id, sedeForm.nombre, sedeForm.direccion, sedeForm.pais_id);
      else await createSede(sedeForm.nombre, sedeForm.direccion, sedeForm.pais_id);
      alert('Sede guardada');
      setIsModalOpen(false);
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) await updateArea(editingItem.id, areaForm.nombre, areaForm.sede_id, areaForm.activo);
      else await createArea(areaForm.nombre, areaForm.sede_id, areaForm.activo);
      alert('Área guardada');
      setIsModalOpen(false);
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleUSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) await updateUbicacion(editingItem.id, uForm.nombre, uForm.area_id, uForm.activo);
      else await createUbicacion(uForm.nombre, uForm.area_id, uForm.activo);
      alert('Ubicación guardada');
      setIsModalOpen(false);
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  // --- Opens ---
  const openNew = (tab: TabType) => {
    setEditingItem(null);
    if (tab === 'paises') { setPaisForm({ nombre: '', codigo: '' }); setIsPaisModalOpen(true); }
    if (tab === 'sedes') { setSedeForm({ nombre: '', direccion: '', pais_id: '' }); setIsModalOpen(true); }
    if (tab === 'areas') { setAreaForm({ nombre: '', sede_id: '', activo: true }); setIsModalOpen(true); }
    if (tab === 'ubicaciones') { setUForm({ nombre: '', area_id: '', activo: true }); setIsModalOpen(true); }
  };

  const openEdit = (tab: TabType, item: any) => {
    setEditingItem(item);
    if (tab === 'paises') { setPaisForm({ nombre: item.nombre, codigo: item.codigo || '' }); setIsPaisModalOpen(true); }
    if (tab === 'sedes') { setSedeForm({ nombre: item.nombre, direccion: item.direccion || '', pais_id: item.pais_id || '' }); setIsModalOpen(true); }
    if (tab === 'areas') { setAreaForm({ nombre: item.nombre, sede_id: item.sede_id, activo: item.activo }); setIsModalOpen(true); }
    if (tab === 'ubicaciones') { setUForm({ nombre: item.nombre, area_id: item.area_id, activo: item.activo }); setIsModalOpen(true); }
  };

  const handleDelete = async (tab: TabType, id: string) => {
    if (!confirm('¿Estás seguro?')) return;
    try {
      if (tab === 'paises') await deletePais(id);
      if (tab === 'sedes') await deleteSede(id);
      if (tab === 'areas') await deleteArea(id);
      if (tab === 'ubicaciones') await deleteUbicacion(id);
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="animate-fade-in">
      <BackButton />
      <header className={styles.header} style={{ marginBottom: '15px' }}>
        <h1 className={styles.title}>Configuración del Sistema</h1>
        <p className={styles.subtitle}>Gestión de identidades, ubicaciones regionales y activos.</p>
      </header>

      <ConfigNav />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div className={styles.tabs} style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
            {['paises', 'sedes', 'areas', 'ubicaciones'].map((tab) => (
              <button 
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab as TabType)}
                style={{ 
                  padding: '8px 16px', 
                  background: activeTab === tab ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                  borderRadius: 'var(--radius-md)', 
                  color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'paises' ? 'Países' : tab === 'sedes' ? 'Sedes' : tab === 'areas' ? 'Áreas' : 'Ubicaciones'}
              </button>
            ))}
          </div>
          
          <button className={`${styles.addButton} glass`} onClick={() => openNew(activeTab)}>
            <Plus size={20} /> <span>Nuevo {activeTab === 'paises' ? 'País' : activeTab === 'sedes' ? 'Sede' : activeTab === 'areas' ? 'Área' : 'Ubicación'}</span>
          </button>
      </div>

      <div className={styles.grid}>
        {activeTab === 'paises' && paises.map((p) => (
          <Card key={p.id} title={p.nombre} subtitle={`Cód: ${p.codigo || 'N/A'}`} icon={<Globe size={24}/>} onEdit={() => openEdit('paises', p)} onDelete={() => handleDelete('paises', p.id)} />
        ))}
        {activeTab === 'sedes' && sedes.map((s) => (
          <Card key={s.id} title={s.nombre} subtitle={`${s.pais_nombre || 'Sin país'} - ${s.direccion || ''}`} icon={<MapPin size={24}/>} onEdit={() => openEdit('sedes', s)} onDelete={() => handleDelete('sedes', s.id)} />
        ))}
        {activeTab === 'areas' && areas.map((a) => (
          <Card key={a.id} title={a.nombre} subtitle={a.sede_nombre || ''} status={a.activo} icon={<Layout size={24}/>} onEdit={() => openEdit('areas', a)} onDelete={() => handleDelete('areas', a.id)} />
        ))}
        {activeTab === 'ubicaciones' && ubicaciones.map((u) => (
          <Card key={u.id} title={u.nombre} subtitle={`${u.sede_nombre} > ${u.area_nombre}`} status={u.activo} icon={<Map size={24}/>} onEdit={() => openEdit('ubicaciones', u)} onDelete={() => handleDelete('ubicaciones', u.id)} />
        ))}
      </div>

      {/* --- Modals --- */}
      {isPaisModalOpen && (
        <Modal title={editingItem ? 'Editar País' : 'Nuevo País'} onClose={() => setIsPaisModalOpen(false)}>
           <form className={styles.form} onSubmit={handlePaisSubmit}>
              <div className={styles.formGroup}><label>Nombre</label><input type="text" value={paisForm.nombre} onChange={e => setPaisForm({...paisForm, nombre: e.target.value})} required /></div>
              <div className={styles.formGroup}><label>Código</label><input type="text" value={paisForm.codigo} onChange={e => setPaisForm({...paisForm, codigo: e.target.value})} /></div>
              <div className={styles.modalActions}><button type="submit" className={styles.saveBtn}>Guardar</button></div>
           </form>
        </Modal>
      )}

      {isModalOpen && activeTab === 'sedes' && (
        <Modal title={editingItem ? 'Editar Sede' : 'Nueva Sede'} onClose={() => setIsModalOpen(false)}>
           <form className={styles.form} onSubmit={handleSedeSubmit}>
              <div className={styles.formGroup}><label>Nombre</label><input type="text" value={sedeForm.nombre} onChange={e => setSedeForm({...sedeForm, nombre: e.target.value})} required /></div>
              <div className={styles.formGroup}><label>País</label><select value={sedeForm.pais_id} onChange={e => setSedeForm({...sedeForm, pais_id: e.target.value})}><option value="">Seleccionar...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
              <div className={styles.formGroup}><label>Dirección</label><textarea value={sedeForm.direccion} onChange={e => setSedeForm({...sedeForm, direccion: e.target.value})} /></div>
              <div className={styles.modalActions}><button type="submit" className={styles.saveBtn}>Guardar</button></div>
           </form>
        </Modal>
      )}

      {isModalOpen && activeTab === 'areas' && (
        <Modal title={editingItem ? 'Editar Área' : 'Nueva Área'} onClose={() => setIsModalOpen(false)}>
           <form className={styles.form} onSubmit={handleAreaSubmit}>
              <div className={styles.formGroup}><label>Nombre</label><input type="text" value={areaForm.nombre} onChange={e => setAreaForm({...areaForm, nombre: e.target.value})} required /></div>
              <div className={styles.formGroup}><label>Sede</label><select value={areaForm.sede_id} onChange={e => setAreaForm({...areaForm, sede_id: e.target.value})} required><option value="">Seleccionar...</option>{sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></div>
              <div className={styles.formGroup} style={{ flexDirection: 'row', gap: '10px', alignItems: 'center' }}><input type="checkbox" checked={areaForm.activo} onChange={e => setAreaForm({...areaForm, activo: e.target.checked})} /><label>Activo</label></div>
              <div className={styles.modalActions}><button type="submit" className={styles.saveBtn}>Guardar</button></div>
           </form>
        </Modal>
      )}

      {isModalOpen && activeTab === 'ubicaciones' && (
        <Modal title={editingItem ? 'Editar Ubicación' : 'Nueva Ubicación'} onClose={() => setIsModalOpen(false)}>
           <form className={styles.form} onSubmit={handleUSubmit}>
              <div className={styles.formGroup}><label>Nombre</label><input type="text" value={uForm.nombre} onChange={e => setUForm({...uForm, nombre: e.target.value})} required /></div>
              <div className={styles.formGroup}><label>Área</label><select value={uForm.area_id} onChange={e => setUForm({...uForm, area_id: e.target.value})} required><option value="">Seleccionar...</option>{areas.map(a => <option key={a.id} value={a.id}>{a.sede_nombre} - {a.nombre}</option>)}</select></div>
              <div className={styles.formGroup} style={{ flexDirection: 'row', gap: '10px', alignItems: 'center' }}><input type="checkbox" checked={uForm.activo} onChange={e => setUForm({...uForm, activo: e.target.checked})} /><label>Activo</label></div>
              <div className={styles.modalActions}><button type="submit" className={styles.saveBtn}>Guardar</button></div>
           </form>
        </Modal>
      )}
    </div>
  );
}

function Card({ title, subtitle, icon, onEdit, onDelete, status }: { title: string, subtitle: string, icon: React.ReactNode, onEdit: () => void, onDelete: () => void, status?: boolean }) {
  return (
    <div className={`${styles.card} glass`}>
      <div className={styles.cardHeader}>
        <div className={styles.iconWrapper}>{icon}</div>
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={onEdit}><Edit2 size={16} /></button>
          <button className={styles.actionBtn} onClick={onDelete}><Trash2 size={16} /></button>
        </div>
      </div>
      <h3 className={styles.name}>{title}</h3>
      <p className={styles.address}>{subtitle}</p>
      {status !== undefined && (
        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: status ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: status ? '#10b981' : '#ef4444', marginTop: '10px', display: 'inline-block' }}>
          {status ? 'Activo' : 'Inactivo'}
        </span>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} glass animate-fade-in`}>
        <h2>{title}</h2>
        {children}
        <button className={styles.cancelBtn} style={{ width: '100%', marginTop: '10px' }} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}
