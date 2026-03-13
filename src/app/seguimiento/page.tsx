'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  History, 
  MessageSquare,
  User,
  Activity,
  Tag,
  ChevronRight,
  ChevronLeft,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Download,
  Upload,
  Calendar as CalendarIcon,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  CalendarDays,
  Briefcase,
  Package,
  Trash,
  PlusCircle,
  DollarSign,
  X,
  Printer
} from 'lucide-react';
import { 
  getMantenimientos, 
  getActivos, 
  getUsuarios, 
  scheduleMantenimiento, 
  updateMantenimiento,
  getHistorialMantenimiento,
  getEvidencias,
  addEvidencia,
  getActividades,
  addActividad,
  deleteActividad,
  getItems,
  addItem,
  deleteItem
} from '@/lib/actions';
import { useRole } from '@/lib/useRole';
import BackButton from '@/components/BackButton';
import styles from './Seguimiento.module.css';

export default function SeguimientoPage() {
  const { role } = useRole();
  const [view, setView] = useState<'kanban' | 'lista'>('kanban');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [mantenimientos, setMantenimientos] = useState<any[]>([]);
  const [activos, setActivos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any | null>(null);
  const [newComment, setNewComment] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'seguimiento' | 'historial' | 'evidencias' | 'actividades' | 'items'>('seguimiento');
  const [historial, setHistorial] = useState<any[]>([]);
  const [evidencias, setEvidencias] = useState<any[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const [formData, setFormData] = useState({
    activo_id: '', tipo: 'Correctivo', descripcion: '', fecha_programada: new Date().toISOString().split('T')[0], prioridad: 'Media', tecnico_id: ''
  });

  const [activityForm, setActivityForm] = useState({
    descripcion: '', fecha_inicio: '', fecha_fin: ''
  });

  const [itemForm, setItemForm] = useState({
    descripcion: '', cantidad: 1, precio_unitario: 0
  });

  async function loadData() {
    const [m, a, u] = await Promise.all([getMantenimientos(), getActivos(), getUsuarios()]);
    setMantenimientos(m);
    setActivos(a);
    setUsuarios(u.filter(user => user.rol === 'Técnico' || user.rol === 'Jefe'));
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (detailItem) {
      loadExtraInfo(detailItem.id);
    }
  }, [detailItem?.id]);

  async function loadExtraInfo(id: string) {
    const [h, e, a, i] = await Promise.all([
      getHistorialMantenimiento(id),
      getEvidencias(id),
      getActividades(id),
      getItems(id)
    ]);
    setHistorial(h);
    setEvidencias(e);
    setActividades(a);
    setItems(i);
  }

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await scheduleMantenimiento({
      ...formData,
      tipo: formData.tipo as any,
      fecha_programada: new Date(formData.fecha_programada),
      prioridad: formData.prioridad as any,
      tecnico_id: formData.tecnico_id || undefined
    }, role);
    setIsModalOpen(false);
    loadData();
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

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!detailItem) return;
    await addActividad({ ...activityForm, mantenimiento_id: detailItem.id });
    setActivityForm({ descripcion: '', fecha_inicio: '', fecha_fin: '' });
    loadExtraInfo(detailItem.id);
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!detailItem) return;
    await addItem({ ...itemForm, mantenimiento_id: detailItem.id });
    setItemForm({ descripcion: '', cantidad: 1, precio_unitario: 0 });
    loadExtraInfo(detailItem.id);
    loadData(); // Re-fetch all to update total cost in card
  }

  async function handleDeleteActivity(id: string) {
    if (!confirm('¿Eliminar actividad?')) return;
    await deleteActividad(id);
    loadExtraInfo(detailItem.id);
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('¿Eliminar item?')) return;
    await deleteItem(id, detailItem.id);
    loadExtraInfo(detailItem.id);
    loadData();
  }

  async function handleUpdateField(campo: string, valor: any) {
    if (!detailItem) return;
    await updateMantenimiento(detailItem.id, { [campo]: valor }, role);
    const updatedItem = { ...detailItem, [campo]: valor };
    setDetailItem(updatedItem);
    loadData();
    loadExtraInfo(detailItem.id);
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!detailItem || !e.target.files?.length) return;
    for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const dummyUrl = `/uploads/${file.name}`;
        const type = file.type.startsWith('image/') ? 'Imagen' : 'Documento';
        await addEvidencia(detailItem.id, type, dummyUrl, `Adjunto: ${file.name}`, file.name);
    }
    loadExtraInfo(detailItem.id);
    alert('Documentos adjuntos correctamente.');
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, maintenanceId: string) => {
    e.dataTransfer.setData('maintenanceId', maintenanceId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colId) setDragOverColumn(colId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newState: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const maintenanceId = e.dataTransfer.getData('maintenanceId');
    if (!maintenanceId) return;

    const maintenance = mantenimientos.find(m => m.id === maintenanceId);
    if (maintenance && maintenance.estado !== newState) {
      // Optimistic Update
      const previousMantenimientos = [...mantenimientos];
      setMantenimientos(prev => prev.map(m => 
        m.id === maintenanceId ? { ...m, estado: newState } : m
      ));

      try {
        await updateMantenimiento(maintenanceId, { estado: newState as any }, role);
        loadData(); // Ensure consistency
      } catch (err) {
        console.error('Error updating state via drag & drop:', err);
        setMantenimientos(previousMantenimientos);
        alert('Error al actualizar el estado.');
      }
    }
  };

  const filteredMantenimientos = mantenimientos.filter(m => {
    const matchesSearch = m.activo_nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         m.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const mDate = new Date(m.fecha_programada);
    const matchesMonth = mDate.getMonth() === currentDate.getMonth() && mDate.getFullYear() === currentDate.getFullYear();
    return matchesSearch && matchesMonth;
  });

  const getPrioClass = (p: string) => {
    switch(p) {
        case 'Crítica': return styles.prioCritica;
        case 'Alta': return styles.prioAlta;
        case 'Media': return styles.prioMedia;
        default: return styles.prioBaja;
    }
  };

  const columns = [
    { id: 'Programado', label: 'Por Iniciar', icon: <Clock size={16} />, color: styles.statusTodo },
    { id: 'En Proceso', label: 'En Ejecución', icon: <Activity size={16} />, color: styles.statusProcess },
    { id: 'Completado', label: 'Finalizado', icon: <CheckCircle2 size={16} />, color: styles.statusDone }
  ];

  return (
    <div className="animate-fade-in">
      <BackButton />
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Seguimiento de Órdenes</h1>
          <p className={styles.subtitle}>Gestión y control de mantenimientos en curso</p>
        </div>
        <div className={styles.headerActions}>
            <div className={styles.viewToggle}>
                <button className={`${styles.toggleBtn} ${view === 'kanban' ? styles.active : ''}`} onClick={() => setView('kanban')}>
                    <LayoutGrid size={18} />
                    <span>Tablero</span>
                </button>
                <button className={`${styles.toggleBtn} ${view === 'lista' ? styles.active : ''}`} onClick={() => setView('lista')}>
                    <ListIcon size={18} />
                    <span>Lista</span>
                </button>
            </div>
            <button className={`${styles.addButton} glass`} onClick={() => setIsModalOpen(true)}>
            <Plus size={20} />
            <span>Nueva OT</span>
            </button>
        </div>
      </header>

      <div className={`${styles.filterBar} glass`}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar por activo, folio o descripción..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className={styles.monthNav} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className={styles.navBtn} onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px', justifyContent: 'center' }}>
                <CalendarDays size={18} color="var(--primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            </div>
            <button className={styles.navBtn} onClick={handleNextMonth}><ChevronRight size={20} /></button>
        </div>

        <button className={styles.filterBtn}><Filter size={18} /><span>Más Filtros</span></button>
      </div>

      {view === 'kanban' ? (
        <div className={styles.kanbanBoard}>
            {columns.map(col => (
               <div key={col.id} className={styles.kanbanColumn}>
                  <div className={styles.columnHeader}>
                      <div className={styles.headerTitle}>
                          {col.icon}
                          <h3>{col.label}</h3>
                          <span className={styles.count}>{filteredMantenimientos.filter(m => m.estado === col.id).length}</span>
                      </div>
                  </div>
                  <div 
                    className={`${styles.columnCards} ${dragOverColumn === col.id ? styles.columnCardsActive : ''}`}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, col.id)}
                  >
                      {filteredMantenimientos.filter(m => m.estado === col.id).map(m => (
                          <div 
                            key={m.id} 
                            className={`${styles.kanbanCard} glass`} 
                            onClick={() => setDetailItem(m)}
                            draggable
                            onDragStart={(e) => handleDragStart(e, m.id)}
                          >
                              <div className={styles.cardHeader}>
                                  <span className={`${styles.prioBadge} ${getPrioClass(m.prioridad)}`}>{m.prioridad}</span>
                                  <MoreVertical size={14} color="var(--text-secondary)" />
                              </div>
                              <h4 className={styles.cardTitle}>{m.activo_nombre}</h4>
                              <p className={styles.cardDesc}>{m.descripcion}</p>
                              <div className={styles.cardFooter}>
                                  <div className={styles.metaInfo}>
                                      <User size={12} />
                                      <span>{m.tecnico_nombre || 'S/A'}</span>
                                  </div>
                                  <div className={styles.metaInfo}>
                                      <CalendarIcon size={12} />
                                      <span>{new Date(m.fecha_programada).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
               </div> 
            ))}
        </div>
      ) : (
        <div className={`${styles.listView} glass`}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Activo</th>
                        <th>Descripción</th>
                        <th>Técnico</th>
                        <th>Prioridad</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {filteredMantenimientos.map(m => (
                        <tr key={m.id} onClick={() => setDetailItem(m)} style={{ cursor: 'pointer' }}>
                            <td className={styles.assetCell}>
                                <strong>{m.tipo}</strong>
                                <span>{m.activo_nombre}</span>
                            </td>
                            <td>{m.descripcion}</td>
                            <td>{m.tecnico_nombre || 'No asignado'}</td>
                            <td><span className={`${styles.prioBadge} ${getPrioClass(m.prioridad)}`}>{m.prioridad}</span></td>
                            <td>
                                <span className={`${styles.statusDot} ${styles[(m.estado || '').replace(/\s/g, '')]}`}></span>
                                {m.estado}
                            </td>
                            <td>{new Date(m.fecha_programada).toLocaleDateString()}</td>
                            <td className={styles.rowAction}>Detalle</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass animate-fade-in`}>
            <h2>Crear Nueva Orden de Trabajo</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Activo</label>
                  <select value={formData.activo_id} onChange={e => setFormData({...formData, activo_id: e.target.value})} required>
                    <option value="">Seleccionar Activo</option>
                    {activos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Tipo</label>
                  <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                    <option value="Preventivo">Preventivo</option>
                    <option value="Correctivo">Correctivo</option>
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
                <div className={styles.formGroup}>
                  <label>Fecha Programada</label>
                  <input type="date" value={formData.fecha_programada} onChange={e => setFormData({...formData, fecha_programada: e.target.value})} required />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Descripción del Problema</label>
                <textarea rows={3} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} required></textarea>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Crear Orden</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <button className={styles.printBtn} onClick={() => window.print()} title="Imprimir Orden">
                    <Printer size={20} />
                  </button>
                  <button className={styles.closeModalBtn} onClick={() => setDetailItem(null)}>
                    <X size={20} />
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

                <div className={styles.infoBlock} style={{marginTop: '20px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)'}}>Descripción del Problema / Trabajo:</label>
                  <textarea 
                    className={styles.editableTextArea}
                    value={detailItem.descripcion}
                    onBlur={(e) => handleUpdateField('descripcion', e.target.value)}
                    onChange={(e) => setDetailItem({...detailItem, descripcion: e.target.value})}
                    style={{minHeight: '80px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)'}}
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
                        )) : <p className={styles.noComments}>Aún no hay registros.</p>}
                        </div>
                        <form className={styles.commentForm} onSubmit={handleAddComment}>
                            <textarea placeholder="Escribir avance..." value={newComment} onChange={e => setNewComment(e.target.value)} required />
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
                        <div className={styles.tableWrapper} style={{ height: '250px', overflowY: 'auto', marginBottom: '15px' }}>
                            <table className={styles.miniTable}>
                                <thead>
                                    <tr>
                                        <th>Descripción</th>
                                        <th>Cant</th>
                                        <th>P.U.</th>
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
                                            <td><button onClick={() => handleDeleteItem(i.id)} className={styles.deleteBtn}><Trash size={14} /></button></td>
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
                                    <div className={styles.historyBody}>
                                        <span className={styles.historyField}>{h.campo}:</span>
                                        <div className={styles.historyValues}>
                                            <span className={styles.oldVal}>{h.valor_anterior || '---'}</span>
                                            <ChevronRight size={14} />
                                            <span className={styles.newVal}>{h.valor_nuevo}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : <p className={styles.noComments}>Sin cambios.</p>}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Printable Area - Only visible when printing */}
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
