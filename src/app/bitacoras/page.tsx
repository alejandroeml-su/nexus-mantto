'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Paperclip, 
  CheckCircle2, 
  Search, 
  History, 
  MessageSquare, 
  Activity, 
  Tag, 
  AlertTriangle, 
  User, 
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Download,
  Upload,
  X,
  Briefcase,
  Package,
  Trash,
  PlusCircle,
  Clock
} from 'lucide-react';
import { 
  getMantenimientos, 
  getActivos, 
  getUsuarios, 
  createBitacora, 
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
import styles from './Bitacoras.module.css';

export default function BitacorasPage() {
  const { role } = useRole();
  const [logs, setLogs] = useState<any[]>([]);
  const [activos, setActivos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any | null>(null);
  const [newComment, setNewComment] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'seguimiento' | 'actividades' | 'items' | 'evidencias' | 'historial'>('seguimiento');
  const [historial, setHistorial] = useState<any[]>([]);
  const [evidencias, setEvidencias] = useState<any[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [activityForm, setActivityForm] = useState({ descripcion: '', fecha_inicio: '', fecha_fin: '' });
  const [itemForm, setItemForm] = useState({ descripcion: '', cantidad: 1, precio_unitario: 0 });

  const [formData, setFormData] = useState({
    activo_id: '',
    tipo: 'Preventivo',
    descripcion: '',
    tecnico_id: '',
    fecha_programada: new Date().toISOString().split('T')[0],
    comentarios: '',
    prioridad: 'Media'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (detailItem) {
      loadExtraInfo(detailItem.id);
    }
  }, [detailItem?.id]);

  async function loadData() {
    const [m, a, u] = await Promise.all([
      getMantenimientos(),
      getActivos(),
      getUsuarios()
    ]);
    setLogs(m.filter((item: any) => item.estado === 'Completado' || item.estado === 'Cerrado' || item.estado === 'Cancelado'));
    setActivos(a);
    setUsuarios(u.filter(user => user.rol === 'Técnico' || user.rol === 'Jefe'));
  }

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

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailItem) return;
    await addActividad({ ...activityForm, mantenimiento_id: detailItem.id });
    setActivityForm({ descripcion: '', fecha_inicio: '', fecha_fin: '' });
    loadExtraInfo(detailItem.id);
  };

  const handleDeleteActivity = async (id: string) => {
    if (confirm('¿Eliminar actividad?')) {
        await deleteActividad(id);
        loadExtraInfo(detailItem.id);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailItem) return;
    await addItem({ ...itemForm, mantenimiento_id: detailItem.id });
    setItemForm({ descripcion: '', cantidad: 1, precio_unitario: 0 });
    loadExtraInfo(detailItem.id);
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('¿Eliminar item?')) {
        await deleteItem(id, detailItem.id);
        loadExtraInfo(detailItem.id);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createBitacora(formData as any, role);
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
    
    // Simulate upload for each file
    for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const dummyUrl = `/uploads/${file.name}`; // Simulation
        const type = file.type.startsWith('image/') ? 'Imagen' : 'Documento';
        
        await addEvidencia(detailItem.id, type, dummyUrl, `Evidencia de trabajo: ${file.name}`, file.name);
    }
    
    loadExtraInfo(detailItem.id);
    alert('Documentos adjuntos correctamente.');
  };

  return (
    <div className="animate-fade-in">
      <BackButton />
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.title}>Bitácora de Mantenimientos</h1>
            <p className={styles.subtitle}>Historial detallado de trabajos finalizados</p>
          </div>
          <button className={`${styles.addButton} glass`} onClick={() => setIsModalOpen(true)}>
            <Plus size={20} />
            <span>Registrar en Bitácora</span>
          </button>
        </div>
      </header>

      <div className={`${styles.actionBar} glass`}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input type="text" placeholder="Buscar por activo, folio o técnico..." className={styles.searchInput} />
        </div>
      </div>

      <div className={styles.logList}>
        {logs.length > 0 ? logs.map((log) => (
          <div key={log.id} className={`${styles.logCard} glass`} onClick={() => setDetailItem(log)} style={{ cursor: 'pointer' }}>
            <div className={styles.logMain}>
              <div className={styles.iconWrapper}>
                <CheckCircle2 size={24} className={styles.checkIcon} />
              </div>
              <div>
                <h3 className={styles.assetName}>{log.activo_nombre}</h3>
                <div className={styles.logMeta}>
                  <span>Reg: OT-{log.id.split('-')[0].toUpperCase()}</span> • <span>Finalizado: {new Date(log.fecha_fin || log.fecha_programada).toLocaleDateString()}</span> • <span>Técnico: {log.tecnico_nombre || 'No asignado'}</span>
                </div>
                {log.comentarios && <p className={styles.logMeta} style={{ marginTop: '4px', fontStyle: 'italic' }}>"{log.comentarios.split('\n---')[0].substring(0, 100)}..."</p>}
              </div>
            </div>
            <div className={styles.logActions}>
               <ChevronRight size={20} style={{ opacity: 0.5 }}  />
            </div>
          </div>
        )) : (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>No hay registros de mantenimientos completados.</p>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass animate-fade-in`}>
            <h2>Registrar Mantenimiento en Bitácora</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Activo</label>
                  <select 
                    value={formData.activo_id} 
                    onChange={e => setFormData({...formData, activo_id: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar Activo</option>
                    {activos.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.codigo_activo})</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Tipo de Mantenimiento</label>
                  <select 
                    value={formData.tipo} 
                    onChange={e => setFormData({...formData, tipo: e.target.value})}
                  >
                    <option value="Preventivo">Preventivo</option>
                    <option value="Correctivo">Correctivo</option>
                    <option value="Predictivo">Predictivo</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Técnico Responsable</label>
                  <select 
                    value={formData.tecnico_id} 
                    onChange={e => setFormData({...formData, tecnico_id: e.target.value})}
                  >
                    <option value="">Seleccionar Técnico</option>
                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Fecha de Realización</label>
                  <input 
                    type="date" 
                    value={formData.fecha_programada} 
                    onChange={e => setFormData({...formData, fecha_programada: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Descripción del Trabajo</label>
                <textarea 
                  rows={2} 
                  value={formData.descripcion} 
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  required
                ></textarea>
              </div>
              <div className={styles.formGroup}>
                <label>Comentarios / Observaciones Finales</label>
                <textarea 
                  rows={2} 
                  value={formData.comentarios} 
                  onChange={e => setFormData({...formData, comentarios: e.target.value})}
                ></textarea>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Guardar en Bitácora</button>
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
                <h2 className={styles.detailTitle}>Folio: REG-{detailItem.id.split('-')[0].toUpperCase()}</h2>
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
                        <select 
                            className={styles.statusSelect}
                            value={detailItem.estado || ''}
                            onChange={(e) => handleUpdateField('estado', e.target.value)}
                        >
                            <option value="Completado">Completado</option>
                            <option value="Cerrado">Cerrado</option>
                            <option value="Cancelado">Cancelado</option>
                        </select>
                    </div>

                    <div className={styles.infoRow}>
                        <label><Tag size={14} /> Tipo</label>
                        <select 
                            className={styles.statusSelect}
                            value={detailItem.tipo || ''}
                            onChange={(e) => handleUpdateField('tipo', e.target.value)}
                        >
                            <option value="Preventivo">Preventivo</option>
                            <option value="Correctivo">Correctivo</option>
                            <option value="Predictivo">Predictivo</option>
                        </select>
                    </div>

                    <div className={styles.infoRow}>
                        <label><AlertTriangle size={14} /> Prioridad</label>
                        <select 
                            className={styles.statusSelect}
                            value={detailItem.prioridad || ''}
                            onChange={(e) => handleUpdateField('prioridad', e.target.value)}
                        >
                            <option value="Baja">Baja</option>
                            <option value="Media">Media</option>
                            <option value="Alta">Alta</option>
                            <option value="Crítica">Crítica</option>
                        </select>
                    </div>

                    <div className={styles.infoRow}>
                        <label><User size={14} /> Técnico</label>
                        <select 
                            className={styles.statusSelect}
                            value={detailItem.tecnico_id || ''}
                            onChange={(e) => handleUpdateField('tecnico_id', e.target.value)}
                        >
                            <option value="">No asignado</option>
                            {usuarios.map(u => (
                                <option key={u.id} value={u.id}>{u.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.infoBlock}>
                  <label>Descripción del Trabajo Realizado:</label>
                  <textarea 
                    className={styles.editableTextArea}
                    value={detailItem.descripcion || ''}
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
                        )) : <p className={styles.noComments}>Aún no hay registros de seguimiento.</p>}
                        </div>
                        
                        <form className={styles.commentForm} onSubmit={handleAddComment}>
                        <textarea 
                            placeholder="Escribir avance o actualización..." 
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            required
                        />
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
                                    <div className={styles.logMeta}>
                                        <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
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
                                <div key={ev.id} className={styles.evidenceCard} title={ev.descripcion}>
                                    <div className={styles.evidenceIcon}>
                                        {ev.tipo === 'Imagen' ? <ImageIcon size={20} /> : <FileText size={20} />}
                                    </div>
                                    <span className={styles.evidenceName}>{ev.nombre || 'Archivo'}</span>
                                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                                        <Download size={14} />
                                    </a>
                                </div>
                            )) : (
                                <p className={styles.noComments}>No hay documentos adjuntos.</p>
                            )}
                        </div>
                        
                        <div className={styles.uploadSection}>
                            <label className={styles.uploadTrigger}>
                                <Upload size={18} />
                                <span>Adjuntar Documentos / Imágenes</span>
                                <input 
                                    type="file" 
                                    multiple 
                                    className={styles.fileInput} 
                                    onChange={handleFileUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4px' }}>
                                Puedes seleccionar varios archivos a la vez.
                            </p>
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
                            )) : (
                                <p className={styles.noComments}>No hay registros de cambios.</p>
                            )}
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
