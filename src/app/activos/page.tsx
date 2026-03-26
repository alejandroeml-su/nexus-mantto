'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  QrCode, 
  Box, 
  History, 
  Clock, 
  CheckCircle2, 
  FileText, 
  X,
  Settings,
  Briefcase,
  Package,
  Paperclip,
  Activity,
  Tag,
  AlertTriangle,
  User,
  MessageSquare,
  Trash,
  PlusCircle,
  Image as ImageIcon,
  Download,
  Upload,
  ChevronRight,
  CalendarDays,
  Square,
  CheckSquare,
  Printer
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { 
  getActivos, 
  createActivo, 
  updateActivo, 
  deleteActivo, 
  getSedes, 
  getAreas,
  getMantenimientos, 
  updateMantenimiento,
  getHistorialMantenimiento,
  getUsuarios,
  scheduleBatchMantenimiento,
  getCatalogo,
  createCatalogoEntry,
  deleteCatalogoEntry,
  getUbicaciones,
  getActividades,
  addActividad,
  deleteActividad,
  getItems,
  addItem,
  deleteItem,
  getEvidencias,
  addEvidencia
} from '@/lib/actions';
import { Activo, Sede } from '@/lib/types';
import { useRole } from '@/lib/useRole';
import BackButton from '@/components/BackButton';
import QRModal from '@/components/Activos/QRModal';
import styles from './Activos.module.css';

function ActivosContent() {
  const { role, hasPermission } = useRole();
  const searchParams = useSearchParams();
  const estadoFilter = searchParams.get('estado');
  
  const [activos, setActivos] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [selectedQR, setSelectedQR] = useState<{ name: string; value: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<any[]>([]);
  const [filteredUbicaciones, setFilteredUbicaciones] = useState<any[]>([]);
  
  const [selectedHistory, setSelectedHistory] = useState<any[]>([]);
  const [activeHistoryName, setActiveHistoryName] = useState('');
  const [selectedAssetForHistory, setSelectedAssetForHistory] = useState<any | null>(null);
  const [detailItem, setDetailItem] = useState<any | null>(null);
  const [newComment, setNewComment] = useState('');
  const [editingActivo, setEditingActivo] = useState<any | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'seguimiento' | 'actividades' | 'items' | 'evidencias' | 'historial'>('seguimiento');
  const [historial, setHistorial] = useState<any[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [evidencias, setEvidencias] = useState<any[]>([]);
  const [activityForm, setActivityForm] = useState({ descripcion: '', fecha_inicio: '', fecha_fin: '' });
  const [itemForm, setItemForm] = useState({ descripcion: '', cantidad: 1, precio_unitario: 0 });
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Catalogs
  const [catalogType, setCatalogType] = useState<'tipos_activo' | 'marcas' | 'modelos' | 'estados_activo'>('tipos_activo');
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [tiposCatalog, setTiposCatalog] = useState<any[]>([]);
  const [marcasCatalog, setMarcasCatalog] = useState<any[]>([]);
  const [modelosCatalog, setModelosCatalog] = useState<any[]>([]);
  const [estadosCatalog, setEstadosCatalog] = useState<any[]>([]);
  const [newEntry, setNewEntry] = useState('');

  const [formData, setFormData] = useState<Partial<Activo>>({
    nombre: '', codigo_activo: '', marca: '', modelo: '', serie: '', anio: new Date().getFullYear(), descripcion: '', 
    sede_id: '', area_id: '', ubicacion_id: '', estado: 'Operativo'
  });

  const [batchData, setBatchData] = useState({
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    frecuencia: 'Mensual'
  });

  useEffect(() => {
    loadData();
    loadExtraData();
    loadAllCatalogs();
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [catalogType]);

  useEffect(() => {
    if (detailItem) {
      loadExtraInfo(detailItem.id);
    }
  }, [detailItem?.id]);

  async function loadData() {
    const [a, ubi, s, ar] = await Promise.all([
        getActivos(), 
        getUbicaciones(),
        getSedes(),
        getAreas()
    ]);
    setActivos(a);
    setUbicaciones(ubi);
    setSedes(s as Sede[]);
    setAreas(ar);
  }

  async function loadExtraData() {
    const u = await getUsuarios();
    setUsuarios(u.filter(user => user.rol === 'Técnico' || user.rol === 'Jefe'));
  }

  async function loadCatalog() {
    const data = await getCatalogo(catalogType);
    setCatalogItems(data);
  }

  async function loadAllCatalogs() {
    const [t, m, mo, e] = await Promise.all([
      getCatalogo('tipos_activo'),
      getCatalogo('marcas'),
      getCatalogo('modelos'),
      getCatalogo('estados_activo')
    ]);
    setTiposCatalog(t);
    setMarcasCatalog(m);
    setModelosCatalog(mo);
    setEstadosCatalog(e);
  }

  async function loadExtraInfo(id: string) {
    const [h, a, i, e] = await Promise.all([
      getHistorialMantenimiento(id),
      getActividades(id),
      getItems(id),
      getEvidencias(id)
    ]);
    setHistorial(h);
    setActividades(a);
    setItems(i);
    setEvidencias(e);
  }

  async function addCatalogEntry() {
    if (!newEntry.trim()) return;
    await createCatalogoEntry(catalogType, newEntry);
    setNewEntry('');
    loadCatalog();
    loadAllCatalogs();
  }

  async function removeCatalogEntry(id: string) {
    await deleteCatalogoEntry(catalogType, id);
    loadCatalog();
    loadAllCatalogs();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingActivo) {
      await updateActivo(editingActivo.id, formData);
    } else {
      await createActivo(formData, role);
    }
    closeModal();
    loadData();
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
      ubicacion_id: activo.ubicacion_id || '',
      estado: activo.estado || 'Operativo',
      tipo: activo.tipo || 'General'
    });

    if (activo.sede_id) {
        setFilteredAreas(areas.filter(ar => ar.sede_id === activo.sede_id));
    }
    if (activo.area_id) {
        setFilteredUbicaciones(ubicaciones.filter(ub => ub.area_id === activo.area_id));
    }

    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (confirm('¿Eliminar este activo de forma permanente?')) {
      await deleteActivo(id);
      loadData();
    }
  }

  async function openHistory(activo: any) {
    const allMaint = await getMantenimientos();
    const history = allMaint.filter((m: any) => m.activo_id === activo.id)
      .sort((a: any, b: any) => new Date(b.fecha_programada).getTime() - new Date(a.fecha_programada).getTime());
    setSelectedHistory(history);
    setActiveHistoryName(activo.nombre);
    setSelectedAssetForHistory(activo);
    setIsHistoryOpen(true);
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!detailItem || !newComment.trim()) return;
    
    const updatedComments = detailItem.comentarios 
      ? `${detailItem.comentarios}\n---\n${new Date().toLocaleString()}: ${newComment}`
      : `${new Date().toLocaleString()}: ${newComment}`;
      
    await updateMantenimiento(detailItem.id, { comentarios: updatedComments }, role);
    setDetailItem({ ...detailItem, comentarios: updatedComments });
    setNewComment('');
    loadData();
    loadExtraInfo(detailItem.id);
  }

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailItem) return;
    await addActividad({
      mantenimiento_id: detailItem.id, 
      descripcion: activityForm.descripcion, 
      fecha_inicio: activityForm.fecha_inicio, 
      fecha_fin: activityForm.fecha_fin
    });
    setActivityForm({ descripcion: '', fecha_inicio: '', fecha_fin: '' });
    loadExtraInfo(detailItem.id);
  };

  const handleDeleteActivity = async (id: string) => {
    if (confirm('¿Eliminar esta actividad?')) {
        await deleteActividad(id);
        if (detailItem) loadExtraInfo(detailItem.id);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailItem) return;
    await addItem({
      mantenimiento_id: detailItem.id, 
      descripcion: itemForm.descripcion, 
      cantidad: itemForm.cantidad, 
      precio_unitario: itemForm.precio_unitario
    });
    setItemForm({ descripcion: '', cantidad: 1, precio_unitario: 0 });
    loadExtraInfo(detailItem.id);
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('¿Eliminar este material?')) {
        await deleteItem(id, detailItem.id);
        if (detailItem) loadExtraInfo(detailItem.id);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!detailItem || !e.target.files?.length) return;
    for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const dummyUrl = `/uploads/${file.name}`;
        const type = file.type.startsWith('image/') ? 'Imagen' : 'Documento';
        await addEvidencia(detailItem.id, type, dummyUrl, `Adjunto: ${file.name}`, file.name);
    }
    loadExtraInfo(detailItem.id);
  };

  async function handleUpdateField(campo: string, valor: any) {
    if (!detailItem) return;
    await updateMantenimiento(detailItem.id, { [campo]: valor }, role);
    const updatedItem = { ...detailItem, [campo]: valor };
    setDetailItem(updatedItem);
    loadData();
    loadExtraInfo(detailItem.id);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingActivo(null);
    setFormData({ 
      nombre: '', codigo_activo: '', marca: '', modelo: '', serie: '', anio: new Date().getFullYear(), 
      descripcion: '', sede_id: '', area_id: '', ubicacion_id: '', estado: 'Operativo' 
    });
    setFilteredAreas([]);
    setFilteredUbicaciones([]);
  }

  const handleSedeChange = (sedeId: string) => {
    setFormData({ ...formData, sede_id: sedeId, area_id: '', ubicacion_id: '' });
    setFilteredAreas(areas.filter(a => a.sede_id === sedeId));
    setFilteredUbicaciones([]);
  };

  const handleAreaChange = (areaId: string) => {
    setFormData({ ...formData, area_id: areaId, ubicacion_id: '' });
    setFilteredUbicaciones(ubicaciones.filter(u => u.area_id === areaId));
  };

  const toggleSelection = (id: string) => {
    setSelectedAssetIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedAssets = activos.filter(a => selectedAssetIds.includes(a.id));
  const sameType = selectedAssets.length > 0 && selectedAssets.every(a => a.tipo === selectedAssets[0].tipo);

  async function handleBatchSchedule(e: React.FormEvent) {
    e.preventDefault();
    const start = new Date(batchData.fecha_inicio);
    const end = new Date(batchData.fecha_fin);
    const workOrders: any[] = [];

    // Calculation starting from scheduling day (today)
    const today = new Date();
    
    selectedAssetIds.forEach(assetId => {
      let current = new Date(today); // Base for calculations
      
      // Calculate intervals proportional to selected frequency
      while (current <= end) {
        if (current >= start) {
          workOrders.push({
            activo_id: assetId,
            tipo: 'Preventivo',
            descripcion: `Mantenimiento preventivo cíclico (${batchData.frecuencia})`,
            fecha_programada: new Date(current),
            estado: 'Programado',
            prioridad: 'Media'
          });
        }

        // Advance date based on frequency
        switch (batchData.frecuencia) {
          case 'Semanal': current.setDate(current.getDate() + 7); break;
          case 'Quincenal': current.setDate(current.getDate() + 14); break;
          case 'Mensual': current.setMonth(current.getMonth() + 1); break;
          case 'Bimensual': current.setMonth(current.getMonth() + 2); break;
          case 'Trimestral': current.setMonth(current.getMonth() + 3); break;
          case 'Semestral': current.setMonth(current.getMonth() + 6); break;
          case 'Anual': current.setFullYear(current.getFullYear() + 1); break;
          default: current.setDate(current.getDate() + 3650); // Stop
        }
      }
    });

    await scheduleBatchMantenimiento(workOrders, role);
    setIsBatchModalOpen(false);
    setSelectedAssetIds([]);
    alert(`${workOrders.length} órdenes de trabajo preventivas programadas con éxito.`);
  }

  const displayActivos = estadoFilter 
    ? activos.filter(a => a.estado === estadoFilter)
    : activos;

  return (
    <div className="animate-fade-in">
      <BackButton />
      <header className={styles.header}>
        <h1 className={styles.title}>
          {estadoFilter ? `Activos: ${estadoFilter}` : 'Gestión de Activos'}
        </h1>
        <div className={styles.headerActions}>
           {selectedAssetIds.length > 0 && sameType && (
             <button className={`${styles.batchScheduleButton} glass animate-fade-in`} onClick={() => setIsBatchModalOpen(true)}>
               <CalendarDays size={20} />
               <span>Programar Ciclo ({selectedAssetIds.length})</span>
             </button>
           )}
           <div style={{ display: 'flex', gap: '8px' }}>
              <button className={`${styles.configButton} glass`} onClick={() => setIsCatalogModalOpen(true)}>
                <Settings size={20} />
              </button>
              {hasPermission('manage_activos') && (
                <button className={`${styles.addButton} glass`} onClick={() => setIsModalOpen(true)}>
                  <Plus size={20} />
                  <span>Nuevo Activo</span>
                </button>
              )}
           </div>
        </div>
      </header>

      <div className={`${styles.actionBar} glass`}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input type="text" placeholder="Buscar por nombre, serie o QR..." className={styles.searchInput} />
        </div>
        <div className={styles.stats}>
          <span>{activos.length} Activos Totales</span>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '40px' }}><Square size={18} /></th>
              <th>ACTIVO</th>
              <th>SERIE / QR</th>
              <th>SEDE / ÁREA / UBICACIÓN</th>
              <th>ESTADO</th>
              <th style={{ textAlign: 'right' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {displayActivos.map((activo) => (
              <tr key={activo.id} className={styles.row}>
                <td>
                  <button onClick={() => toggleSelection(activo.id)} className={styles.checkBtn}>
                    {selectedAssetIds.includes(activo.id) ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} />}
                  </button>
                </td>
                <td>
                  <div className={styles.assetInfo}>
                    <div className={styles.assetIcon}><Box size={20} /></div>
                    <div>
                      <span className={styles.assetName}>{activo.nombre}</span>
                      <span className={styles.assetType}>{activo.tipo}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.qrInfo}>
                    <span className={styles.serieText}>{activo.serie || 'S/N'}</span>
                    <button className={styles.qrBtn} onClick={() => setSelectedQR({ name: activo.nombre, value: activo.qr_code })}><QrCode size={16} /></button>
                  </div>
                </td>
                 <td>
                   <div className={styles.locationInfo}>
                     <span className={styles.sedeName}>{activo.sede_nombre || '---'}</span>
                     <span className={styles.deptoName} style={{opacity: 0.8}}>{activo.area_nombre || '---'}</span>
                     <span style={{fontSize: '0.75rem', opacity: 0.6}}>{activo.ubicacion_nombre || '---'}</span>
                   </div>
                 </td>
                <td>
                  <span className={`${styles.statusBadge} ${
                    activo.estado === 'Operativo' ? styles.statusOk : 
                    activo.estado === 'En Mantenimiento' ? styles.statusWarn : 
                    activo.estado === 'Fuera de Servicio' ? styles.statusError : 
                    activo.estado === 'Baja' ? styles.statusError : styles.statusOk
                  }`}>
                    {activo.estado}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className={styles.actions}>
                    <button className={styles.actionIcon} title="Historial" onClick={() => openHistory(activo)}><History size={18} /></button>
                    {hasPermission('manage_activos') && (
                      <>
                        <button className={styles.actionIcon} title="Editar" onClick={() => handleEdit(activo)}><Edit2 size={18} /></button>
                        <button className={styles.actionIcon} title="Eliminar" onClick={() => handleDelete(activo.id)}><Trash2 size={18} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isCatalogModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass animate-fade-in`} style={{ width: '500px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.detailTitle}>Configuración de Catálogos</h2>
              <button className={styles.cancelBtn} onClick={() => setIsCatalogModalOpen(false)}>Cerrar</button>
            </div>
            
            <div className={styles.catalogNav}>
              <button className={`${styles.catalogTab} ${catalogType === 'tipos_activo' ? styles.activeTab : ''}`} onClick={() => setCatalogType('tipos_activo')}>Tipos</button>
              <button className={`${styles.catalogTab} ${catalogType === 'marcas' ? styles.activeTab : ''}`} onClick={() => setCatalogType('marcas')}>Marcas</button>
              <button className={`${styles.catalogTab} ${catalogType === 'modelos' ? styles.activeTab : ''}`} onClick={() => setCatalogType('modelos')}>Modelos</button>
              <button className={`${styles.catalogTab} ${catalogType === 'estados_activo' ? styles.activeTab : ''}`} onClick={() => setCatalogType('estados_activo')}>Estados</button>
            </div>

            <div className={styles.catalogContent}>
              <div className={styles.addInputGroup}>
                <input 
                  type="text" 
                  placeholder={`Nuevo ${catalogType.replace('_activo', '').replace('s', '')}...`} 
                  value={newEntry}
                  onChange={e => setNewEntry(e.target.value)}
                  className={styles.catalogInput}
                />
                <button className={styles.addEntryBtn} onClick={addCatalogEntry}><Plus size={18} /></button>
              </div>

              <div className={styles.catalogList}>
                {catalogItems.map(item => (
                  <div key={item.id} className={styles.catalogItem}>
                    <span>{item.nombre}</span>
                    <button className={styles.deleteEntryBtn} onClick={() => removeCatalogEntry(item.id)}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <label>Tipo de Activo</label>
                  <input list="tipos-list" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} placeholder="Seleccionar o escribir..." />
                  <datalist id="tipos-list">
                    {tiposCatalog.map(item => <option key={item.id} value={item.nombre} />)}
                  </datalist>
                </div>
                <div className={styles.formGroup}>
                  <label>Código de Activo</label>
                  <input type="text" value={formData.codigo_activo} onChange={e => setFormData({...formData, codigo_activo: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Marca</label>
                  <input list="marcas-list" type="text" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} />
                  <datalist id="marcas-list">
                    {marcasCatalog.map(item => <option key={item.id} value={item.nombre} />)}
                  </datalist>
                </div>
                <div className={styles.formGroup}>
                  <label>Modelo</label>
                  <input list="modelos-list" type="text" value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} />
                  <datalist id="modelos-list">
                    {modelosCatalog.map(item => <option key={item.id} value={item.nombre} />)}
                  </datalist>
                </div>
                <div className={styles.formGroup}>
                  <label>Año</label>
                  <input type="number" value={formData.anio} onChange={e => setFormData({...formData, anio: parseInt(e.target.value)})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Número de Serie</label>
                  <input type="text" value={formData.serie} onChange={e => setFormData({...formData, serie: e.target.value})} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <div className={styles.formGrid}>
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
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Estado</label>
                  <select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value as any})}>
                    {estadosCatalog.length > 0 ? (
                      estadosCatalog.map(item => <option key={item.id} value={item.nombre}>{item.nombre}</option>)
                    ) : (
                      <>
                        <option value="Operativo">Operativo</option>
                        <option value="En Mantenimiento">En Mantenimiento</option>
                        <option value="Fuera de Servicio">Fuera de Servicio</option>
                        <option value="Baja">Baja</option>
                      </>
                    )}
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

      {isBatchModalOpen && (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modal} glass animate-fade-in`}>
                <div className={styles.sectionTitle}>
                    <CalendarDays size={24} />
                    <h2>Programar Ciclo de Mantenimiento Preventivo</h2>
                </div>
                <p className={styles.subTitle}>Se crearán órdenes de trabajo automáticas para {selectedAssetIds.length} activos de tipo {selectedAssets[0].tipo}.</p>
                
                <form className={styles.form} onSubmit={handleBatchSchedule}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Fecha de Inicio del Periodo</label>
                            <input 
                                type="date" 
                                value={batchData.fecha_inicio} 
                                onChange={e => setBatchData({...batchData, fecha_inicio: e.target.value})}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Fecha Final del Periodo</label>
                            <input 
                                type="date" 
                                value={batchData.fecha_fin} 
                                onChange={e => setBatchData({...batchData, fecha_fin: e.target.value})}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Frecuencia de Ciclo</label>
                            <select 
                                value={batchData.frecuencia}
                                onChange={e => setBatchData({...batchData, frecuencia: e.target.value})}
                                required
                            >
                                <option value="Semanal">Semanal</option>
                                <option value="Quincenal">Quincenal</option>
                                <option value="Mensual">Mensual</option>
                                <option value="Bimensual">Bimensual</option>
                                <option value="Trimestral">Trimestral</option>
                                <option value="Semestral">Semestral</option>
                                <option value="Anual">Anual</option>
                            </select>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
                        * Los ciclos se calcularán proporcionalmente a partir de la fecha de hoy, creando las OTs que caigan dentro del rango seleccionado.
                    </p>
                    <div className={styles.modalActions}>
                        <button type="button" onClick={() => setIsBatchModalOpen(false)} className={styles.cancelBtn}>Cancelar</button>
                        <button type="submit" className={styles.saveBtn}>Generar Ciclo de Trabajo</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {isHistoryOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.historyModal} glass animate-fade-in`}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.assetNameTitle}>Hoja de Vida: {activeHistoryName}</h2>
                <div style={{display: 'flex', gap: '15px', color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '4px'}}>
                   <span>Activo creado por: <strong>{selectedAssetForHistory?.creado_por || 'Sistema'}</strong></span>
                   <span>Fecha creación: <strong>{selectedAssetForHistory?.created_at ? new Date(selectedAssetForHistory.created_at).toLocaleString() : '---'}</strong></span>
                </div>
              </div>
              <button className={styles.cancelBtn} onClick={() => setIsHistoryOpen(false)}>Cerrar</button>
            </div>

            <div className={styles.historyTimeline}>
              {selectedHistory.length > 0 ? (
                selectedHistory.map((h: any) => (
                  <div key={h.id} className={`${styles.timelineItem} ${styles.clickable}`} onClick={() => setDetailItem(h)}>
                    <div className={styles.timelineIcon}>
                      <Clock size={14} />
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.timelineDate}>{new Date(h.fecha_programada).toLocaleDateString()}</span>
                        <span className={styles.timelineType}>{h.tipo}</span>
                      </div>
                      <p className={styles.timelineDesc}>{h.descripcion}</p>
                      <div className={styles.timelineMeta}>
                        <span>Estado: <strong>{h.estado}</strong></span> • 
                        <span>Técnico: <strong>{h.tecnico_nombre || 'S/A'}</strong></span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noHistory}>
                  <History size={48} />
                  <p>No hay registros de mantenimiento para este activo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedQR && <QRModal assetName={selectedQR.name} qrValue={selectedQR.value} onClose={() => setSelectedQR(null)} />}

      {/* Detail Modal for Maintenance Orders */}
      {detailItem && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.detailModal} glass animate-fade-in`}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.detailTitle}>Folio: OT-{detailItem.id.split('-')[0].toUpperCase()}</h2>
                <div style={{display: 'flex', gap: '15px', color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '4px'}}>
                   <span>Activo: <strong>{detailItem.activo_nombre}</strong></span>
                   <span>Creado por: <strong>{detailItem.creado_por || 'Sistema'}</strong></span>
                   <span>Fecha Reg: <strong>{new Date(detailItem.created_at).toLocaleString()}</strong></span>
                </div>
              </div>
              <div className={styles.modalHeaderActions}>
                <button className={styles.printBtn} title="Imprimir Orden" onClick={() => window.print()}>
                  <Printer size={20} />
                </button>
                <button className={styles.closeModalBtn} onClick={() => setDetailItem(null)}>
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className={styles.detailGrid}>
              <div className={styles.infoSection}>
                <div className={styles.sectionTitle}>
                    <Activity size={18} />
                    <h3>Información y Edición</h3>
                </div>
                
                <div className={styles.formGrid}>
                    <div className={styles.infoRow}>
                        <label><Activity size={14} /> Estado</label>
                        <select className={styles.statusSelect} value={detailItem.estado || ''} onChange={(e) => handleUpdateField('estado', e.target.value)}>
                            <option value="Programado">Programado</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Completado">Completado</option>
                            <option value="Cancelado">Cancelado</option>
                        </select>
                    </div>
                    <div className={styles.infoRow}>
                        <label><Tag size={14} /> Tipo</label>
                        <select className={styles.statusSelect} value={detailItem.tipo || ''} onChange={(e) => handleUpdateField('tipo', e.target.value)}>
                            <option value="Preventivo">Preventivo</option>
                            <option value="Correctivo">Correctivo</option>
                            <option value="Predictivo">Predictivo</option>
                        </select>
                    </div>
                    <div className={styles.infoRow}>
                        <label><AlertTriangle size={14} /> Prioridad</label>
                        <select className={styles.statusSelect} value={detailItem.prioridad || ''} onChange={(e) => handleUpdateField('prioridad', e.target.value)}>
                            <option value="Baja">Baja</option>
                            <option value="Media">Media</option>
                            <option value="Alta">Alta</option>
                            <option value="Crítica">Crítica</option>
                        </select>
                    </div>
                    <div className={styles.infoRow}>
                        <label><User size={14} /> Técnico</label>
                        <select className={styles.statusSelect} value={detailItem.tecnico_id || ''} onChange={(e) => handleUpdateField('tecnico_id', e.target.value)}>
                            <option value="">No asignado</option>
                            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                        </select>
                    </div>
                </div>

                <div className={styles.infoBlock}>
                  <label style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Descripción del Problema / Trabajo:</label>
                  <textarea 
                    className={styles.editableTextArea}
                    value={detailItem.descripcion}
                    onBlur={(e) => handleUpdateField('descripcion', e.target.value)}
                    onChange={(e) => setDetailItem({...detailItem, descripcion: e.target.value})}
                  />
                </div>
              </div>

              <div className={styles.trackingSection}>
                <div className={styles.subTabs}>
                    <button className={`${styles.subTab} ${activeSubTab === 'seguimiento' ? styles.activeSubTab : ''}`} onClick={() => setActiveSubTab('seguimiento')}>
                        <MessageSquare size={16} /> Seguimiento
                    </button>
                    <button className={`${styles.subTab} ${activeSubTab === 'actividades' ? styles.activeSubTab : ''}`} onClick={() => setActiveSubTab('actividades')}>
                        <Briefcase size={16} /> Actividades
                    </button>
                    <button className={`${styles.subTab} ${activeSubTab === 'items' ? styles.activeSubTab : ''}`} onClick={() => setActiveSubTab('items')}>
                        <Package size={16} /> Materiales
                    </button>
                    <button className={`${styles.subTab} ${activeSubTab === 'evidencias' ? styles.activeSubTab : ''}`} onClick={() => setActiveSubTab('evidencias')}>
                        <Paperclip size={16} /> Evidencias
                    </button>
                    <button className={`${styles.subTab} ${activeSubTab === 'historial' ? styles.activeSubTab : ''}`} onClick={() => setActiveSubTab('historial')}>
                        <History size={16} /> Auditoría
                    </button>
                </div>

                {activeSubTab === 'seguimiento' && (
                    <div className={styles.tabContent}>
                        <div className={styles.commentsList}>
                        {detailItem.comentarios ? detailItem.comentarios.split('\n---\n').map((c: string, idx: number) => (
                            <div key={idx} className={styles.commentItem}>{c}</div>
                        )) : <p className={styles.noComments}>Sin notas registradas.</p>}
                        </div>
                        <form className={styles.commentForm} onSubmit={handleAddComment}>
                            <textarea placeholder="Agregar avance..." value={newComment} onChange={e => setNewComment(e.target.value)} required />
                            <button type="submit" className={styles.saveBtn}>Guardar Notas</button>
                        </form>
                    </div>
                )}

                {activeSubTab === 'actividades' && (
                    <div className={styles.tabContent}>
                        <div className={styles.historyList} style={{ height: '250px' }}>
                            {actividades.map((a) => (
                                <div key={a.id} className={styles.historyItem} style={{ borderLeftColor: 'var(--primary)' }}>
                                    <div className={styles.historyHeader}>
                                        <span style={{ fontWeight: 700 }}>{a.descripcion}</span>
                                        <button onClick={() => handleDeleteActivity(a.id)} className={styles.deleteBtn}><Trash size={14} /></button>
                                    </div>
                                    <div className={styles.metaInfo}>
                                        <Clock size={12} />
                                        <span>{a.fecha_inicio ? new Date(a.fecha_inicio).toLocaleString() : '---'} a {a.fecha_fin ? new Date(a.fecha_fin).toLocaleString() : '---'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form className={styles.quickForm} onSubmit={handleAddActivity}>
                            <input type="text" placeholder="Nueva actividad..." value={activityForm.descripcion} onChange={e => setActivityForm({...activityForm, descripcion: e.target.value})} required />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input type="datetime-local" value={activityForm.fecha_inicio} onChange={e => setActivityForm({...activityForm, fecha_inicio: e.target.value})} required />
                                <input type="datetime-local" value={activityForm.fecha_fin} onChange={e => setActivityForm({...activityForm, fecha_fin: e.target.value})} required />
                            </div>
                            <button type="submit" className={styles.saveBtn}><PlusCircle size={14} /> Agregar Actividad</button>
                        </form>
                    </div>
                )}

                {activeSubTab === 'items' && (
                    <div className={styles.tabContent}>
                        <div className={styles.historyList} style={{ height: '220px', marginBottom: '15px' }}>
                            <table className={styles.miniTable}>
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        <th>Cant.</th>
                                        <th>P. Unit</th>
                                        <th>Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((i) => (
                                        <tr key={i.id}>
                                            <td>{i.descripcion}</td>
                                            <td>{i.cantidad}</td>
                                            <td>${i.precio_unitario}</td>
                                            <td style={{ fontWeight: 700 }}>${i.total}</td>
                                            <td>
                                                <button onClick={() => handleDeleteItem(i.id)} className={styles.deleteBtn}>
                                                    <Trash size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length > 0 && (
                                        <tr className={styles.totalRow}>
                                            <td colSpan={3} style={{textAlign: 'right', paddingRight: '15px'}}>COSTO TOTAL MATERIALES:</td>
                                            <td colSpan={2}>${items.reduce((acc, curr) => acc + parseFloat(curr.total), 0).toFixed(2)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <form className={styles.quickForm} onSubmit={handleAddItem}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)'}}>Descripción Material</label>
                                    <input type="text" placeholder="Repuesto / Insumo..." value={itemForm.descripcion} onChange={e => setItemForm({...itemForm, descripcion: e.target.value})} required />
                                </div>
                                <div style={{ width: '80px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)'}}>Cant.</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        placeholder="0" 
                                        style={{ width: '100%' }}
                                        value={isNaN(itemForm.cantidad) ? '' : itemForm.cantidad} 
                                        onChange={e => setItemForm({...itemForm, cantidad: e.target.value === '' ? 0 : parseFloat(e.target.value)})} 
                                        required 
                                    />
                                </div>
                                <div style={{ width: '110px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)'}}>P. Unit</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        placeholder="0.00" 
                                        style={{ width: '100%' }}
                                        value={isNaN(itemForm.precio_unitario) ? '' : itemForm.precio_unitario} 
                                        onChange={e => setItemForm({...itemForm, precio_unitario: e.target.value === '' ? 0 : parseFloat(e.target.value)})} 
                                        required 
                                    />
                                </div>
                                <div style={{ width: '100px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)'}}>Subtotal</label>
                                    <span style={{fontWeight: '800', fontSize: '1.1rem', color: 'var(--primary)', padding: '10px 0'}}>${(itemForm.cantidad * itemForm.precio_unitario).toFixed(2)}</span>
                                </div>
                                <button type="submit" className={styles.saveBtn} style={{height: '42px', padding: '0 15px'}}>
                                    <PlusCircle size={18} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeSubTab === 'evidencias' && (
                    <div className={styles.tabContent}>
                        <div className={styles.evidenceList}>
                            {evidencias.length > 0 ? evidencias.map((ev) => (
                                <div key={ev.id} className={styles.evidenceCard}>
                                    <div className={styles.evidenceIcon}>
                                        {ev.tipo === 'Imagen' ? <ImageIcon size={20} /> : <FileText size={20} />}
                                    </div>
                                    <span className={styles.evidenceName}>{ev.nombre || 'Archivo'}</span>
                                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                                        <Download size={14} />
                                    </a>
                                </div>
                            )) : <p className={styles.noComments}>Sin evidencias.</p>}
                        </div>
                        <div className={styles.uploadSection}>
                            <label className={styles.uploadTrigger}>
                                <Upload size={18} />
                                <span>Adjuntar Imágenes / Docs</span>
                                <input type="file" multiple className={styles.fileInput} onChange={handleFileUpload} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>
                )}

                {activeSubTab === 'historial' && (
                    <div className={styles.tabContent}>
                        <div className={styles.historyList}>
                            {historial.length > 0 ? historial.map((h) => (
                                <div key={h.id} className={styles.historyItem}>
                                    <div className={styles.historyHeader}>
                                        <span className={styles.historyRole}>{h.usuario_rol}</span>
                                        <span className={styles.historyDate}>{new Date(h.fecha_cambio).toLocaleString()}</span>
                                    </div>
                                    <div className={styles.historyValues}>
                                        <span style={{ fontWeight: 700 }}>{h.campo}:</span>
                                        <span className={styles.oldVal}>{h.valor_anterior || '---'}</span>
                                        <ChevronRight size={14} />
                                        <span className={styles.newVal}>{h.valor_nuevo}</span>
                                    </div>
                                </div>
                            )) : <p className={styles.noComments}>Sin cambios registrados.</p>}
                        </div>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Area for Assets Work Order */}
      {detailItem && (
        <div className={styles.printableArea}>
            <div className={styles.printHeader}>
              <h1>ORDEN DE TRABAJO DE MANTENIMIENTO</h1>
              <div className={styles.printOrderFolio}>OT-{detailItem.id.split('-')[0].toUpperCase()}</div>
            </div>

            <section className={styles.printSection}>
              <h3 className={styles.printSectionTitle}>1. DATOS GENERALES</h3>
              <div className={styles.printDataGrid}>
                <p><strong>Activo:</strong> {detailItem.activo_nombre}</p>
                <p><strong>Tipo:</strong> {detailItem.tipo}</p>
                <p><strong>Prioridad:</strong> {detailItem.prioridad}</p>
                <p><strong>Estado:</strong> {detailItem.estado}</p>
                <p><strong>Fecha Programada:</strong> {new Date(detailItem.fecha_programada).toLocaleDateString()}</p>
                <p><strong>Fecha Inicio:</strong> {detailItem.fecha_inicio ? new Date(detailItem.fecha_inicio).toLocaleString() : '---'}</p>
                <p><strong>Costo Total:</strong> ${detailItem.costo || 0}</p>
              </div>
              <div style={{ marginTop: '15px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                <strong>Breve Descripción del Trabajo:</strong>
                <p>{detailItem.descripcion}</p>
              </div>
            </section>

            <section className={styles.printSection}>
              <h3 className={styles.printSectionTitle}>2. SECCIÓN SOLICITANTE</h3>
              <div className={styles.printDataGrid}>
                <p><strong>Solicitado por:</strong> {detailItem.creado_por || 'Sistema'}</p>
                <p><strong>Fecha de Creación:</strong> {new Date(detailItem.created_at).toLocaleString()}</p>
              </div>
            </section>

            <section className={styles.printSection}>
              <h3 className={styles.printSectionTitle}>3. ACTIVIDADES REALIZADAS</h3>
              <table className={styles.printTable}>
                <thead>
                  <tr>
                    <th>Actividad</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Finalización</th>
                  </tr>
                </thead>
                <tbody>
                  {actividades.length > 0 ? actividades.map(a => (
                    <tr key={a.id}>
                      <td>{a.descripcion}</td>
                      <td>{a.fecha_inicio ? new Date(a.fecha_inicio).toLocaleString() : '---'}</td>
                      <td>{a.fecha_fin ? new Date(a.fecha_fin).toLocaleString() : '---'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} style={{textAlign: 'center', padding: '20px'}}>No hay actividades registradas</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            <section className={styles.printSection}>
              <h3 className={styles.printSectionTitle}>4. MATERIALES Y REPUESTOS UTILIZADOS</h3>
              <table className={styles.printTable}>
                <thead>
                  <tr>
                    <th>Descripción Material</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    <>
                      {items.map(i => (
                        <tr key={i.id}>
                          <td>{i.descripcion}</td>
                          <td>{i.cantidad}</td>
                          <td>${i.precio_unitario}</td>
                          <td>${i.total}</td>
                        </tr>
                      ))}
                      <tr style={{ background: '#f9fafb', fontWeight: 'bold' }}>
                        <td colSpan={3} style={{ textAlign: 'right', padding: '10px' }}>TOTAL MATERIALES Y REPUESTOS:</td>
                        <td style={{ padding: '10px' }}>${items.reduce((acc, curr) => acc + parseFloat(curr.total), 0).toFixed(2)}</td>
                      </tr>
                    </>
                  ) : (
                    <tr><td colSpan={4} style={{textAlign: 'center', padding: '20px'}}>No hay materiales registrados</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            <div className={styles.printSignatures}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLine}></div>
                <p><strong>Firma Técnico Asignado</strong></p>
                <p>{detailItem.tecnico_nombre || '____________________'}</p>
              </div>
              <div className={styles.signatureField}>
                <div className={styles.signatureLine}></div>
                <p><strong>Firma Jefe de Mantenimiento</strong></p>
                <p>____________________</p>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default function ActivosPage() {
  return (
    <React.Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando activos...</div>}>
      <ActivosContent />
    </React.Suspense>
  );
}
