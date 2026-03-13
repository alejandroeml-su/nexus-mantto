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
  CalendarDays
} from 'lucide-react';
import { 
  getMantenimientos, 
  getActivos, 
  getUsuarios, 
  scheduleMantenimiento, 
  updateMantenimiento,
  getHistorialMantenimiento,
  getEvidencias,
  addEvidencia
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
  const [activeSubTab, setActiveSubTab] = useState<'seguimiento' | 'historial' | 'evidencias'>('seguimiento');
  const [historial, setHistorial] = useState<any[]>([]);
  const [evidencias, setEvidencias] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const [formData, setFormData] = useState({
    activo_id: '', tipo: 'Correctivo', descripcion: '', fecha_programada: new Date().toISOString().split('T')[0], prioridad: 'Media', tecnico_id: ''
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
    const [h, e] = await Promise.all([
      getHistorialMantenimiento(id),
      getEvidencias(id)
    ]);
    setHistorial(h);
    setEvidencias(e);
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
                  <div className={styles.columnCards}>
                      {filteredMantenimientos.filter(m => m.estado === col.id).map(m => (
                          <div key={m.id} className={`${styles.kanbanCard} glass`} onClick={() => setDetailItem(m)}>
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
                                <span className={`${styles.statusDot} ${styles[m.estado.replace(/\s/g, '')]}`}></span>
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
              <button className={styles.cancelBtn} onClick={() => setDetailItem(null)}>Cerrar</button>
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
                        <label><User size={14} /> Técnico</label>
                        <select className={styles.statusSelect} value={detailItem.tecnico_id || ''} onChange={(e) => handleUpdateField('tecnico_id', e.target.value)}>
                            <option value="">No asignado</option>
                            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                        </select>
                    </div>
                </div>

                <div className={styles.infoBlock}>
                  <label>Descripción:</label>
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
                    <button className={`${styles.subTab} ${activeSubTab === 'evidencias' ? styles.activeSubTab : ''}`} onClick={() => setActiveSubTab('evidencias')}>
                        <Paperclip size={16} /> Evidencias
                    </button>
                    <button className={`${styles.subTab} ${activeSubTab === 'historial' ? styles.activeSubTab : ''}`} onClick={() => setActiveSubTab('historial')}>
                        <History size={16} /> Historial
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
    </div>
  );
}
