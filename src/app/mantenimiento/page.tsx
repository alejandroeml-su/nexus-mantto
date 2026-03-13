'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Filter, 
  List, 
  Grid, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  MessageSquare,
  User,
  Activity,
  Tag,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Download,
  Upload
} from 'lucide-react';
import { 
  getMantenimientos, 
  updateMantenimiento, 
  getHistorialMantenimiento, 
  getUsuarios,
  getEvidencias,
  addEvidencia
} from '@/lib/actions';
import { useRole } from '@/lib/useRole';
import BackButton from '@/components/BackButton';
import styles from './Mantenimiento.module.css';

export default function MantenimientoPage() {
  const { role } = useRole();
  const [view, setView] = useState<'mes' | 'lista'>('mes');
  const [mantenimientos, setMantenimientos] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [detailItem, setDetailItem] = useState<any | null>(null);
  const [newComment, setNewComment] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'seguimiento' | 'historial' | 'evidencias'>('seguimiento');
  const [historial, setHistorial] = useState<any[]>([]);
  const [evidencias, setEvidencias] = useState<any[]>([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const daysLabels = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

  async function loadData() {
    const [maintData, userData] = await Promise.all([
      getMantenimientos(),
      getUsuarios()
    ]);
    setMantenimientos(maintData);
    setTecnicos(userData.filter(u => u.rol === 'Técnico' || u.rol === 'Jefe'));
  }

  useEffect(() => {
    loadData();
  }, []);

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

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('maintId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dayNumber: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('maintId');
    if (!id) return;

    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber, 12, 0, 0); 
    
    // Optimistic Update
    const updated = mantenimientos.map(m => m.id === id ? { ...m, fecha_programada: newDate } : m);
    setMantenimientos(updated);

    try {
      await updateMantenimiento(id, { fecha_programada: newDate }, role);
      await loadData();
    } catch (err) {
      console.error("Error updating date:", err);
      loadData();
    }
  };

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

  // Calendar Engine
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const today = new Date();
  const isToday = (day: number) => {
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const todayStr = today.toISOString().split('T')[0];
  const todayMaint = mantenimientos.filter(m => {
    const mDate = new Date(m.fecha_programada).toISOString().split('T')[0];
    return mDate === todayStr;
  });

  return (
    <div className="animate-fade-in">
      <BackButton />
      <header className={styles.header}>
        <h1 className={styles.title}>Calendario de Mantenimiento</h1>
        <div className={styles.actions}>
          <Link href="/seguimiento" className={styles.manageBtn}>Gestionar OTs</Link>
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.toggleButton} ${view === 'mes' ? styles.active : ''}`}
              onClick={() => setView('mes')}
            >
              <Grid size={18} />
              <span>Mes</span>
            </button>
            <button 
              className={`${styles.toggleButton} ${view === 'lista' ? styles.active : ''}`}
              onClick={() => setView('lista')}
            >
              <List size={18} />
              <span>Lista</span>
            </button>
          </div>
        </div>
      </header>

      {/* Today Section */}
      <section className={styles.todaySection}>
        <div className={styles.sectionHeader}>
          <Clock size={20} />
          <h2>Mantenimientos de Hoy</h2>
        </div>
        <div className={styles.todayGrid}>
          {todayMaint.length > 0 ? todayMaint.map(m => (
            <div 
              key={m.id} 
              className={`${styles.todayCard} glass ${m.tipo === 'Correctivo' ? styles.correctivoCard : ''}`}
              onClick={() => setDetailItem(m)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.cardTop}>
                <span className={styles.assetName}>{m.activo_nombre}</span>
                <span className={styles.typeTag}>{m.tipo}</span>
              </div>
              <div className={styles.cardBody}>
                <p>{m.descripcion}</p>
                <div style={{marginTop: '8px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', opacity: 0.8}}>
                    <span>Asignado: {m.tecnico_nombre || 'Pendiente'}</span>
                    <span>Creado: {m.creado_por || 'Sistema'}</span>
                </div>
              </div>
            </div>
          )) : (
            <p style={{color: 'var(--text-secondary)'}}>No hay mantenimientos programados para hoy.</p>
          )}
        </div>
      </section>

      <section className={`${styles.calendarContainer} glass`}>
        <div className={styles.calendarHeader}>
          <div className={styles.monthInfo}>
            <h2 className={styles.activeMonth}>{monthNames[month]} {year}</h2>
            <div className={styles.navButtons}>
              <button className={styles.navButton} onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
              <button className={styles.navButton} onClick={handleNextMonth}><ChevronRight size={20} /></button>
            </div>
          </div>
          <div className={styles.calendarFilters}>
            <div className={styles.legend}>
              <span className={styles.legendItem}><span className={`${styles.dot} ${styles.preventivo}`}></span> Preventivo</span>
              <span className={styles.legendItem}><span className={`${styles.dot} ${styles.correctivo}`}></span> Correctivo</span>
            </div>
          </div>
        </div>

        {view === 'mes' ? (
          <div className={styles.calendarGrid}>
            {daysLabels.map(day => (
              <div key={day} className={styles.dayHeader}>{day}</div>
            ))}
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className={styles.dayCellEmpty}></div>;

              const dayEvents = mantenimientos.filter(m => {
                const d = new Date(m.fecha_programada);
                return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
              });

              return (
                <div 
                  key={day} 
                  className={`${styles.dayCell} ${isToday(day) ? styles.today : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  <span className={styles.dayNumber}>{day}</span>
                  {dayEvents.map(m => (
                    <div 
                      key={m.id} 
                      className={`${styles.event} ${m.tipo === 'Correctivo' ? styles.correctivoEvent : styles.preventivoEvent}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, m.id)}
                      onClick={(e) => { e.stopPropagation(); setDetailItem(m); }}
                    >
                      {m.activo_nombre}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.listView}>
            <div className={`${styles.listRow} ${styles.listHeader}`}>
              <span>Activo</span>
              <span>Descripción</span>
              <span>Técnico</span>
              <span>Fecha</span>
            </div>
            {mantenimientos.length > 0 ? mantenimientos.map(m => (
              <div key={m.id} className={`${styles.listRow} glass`} onClick={() => setDetailItem(m)} style={{ cursor: 'pointer' }}>
                <div className={styles.statusIndicator}>
                  <span className={`${styles.dot} ${m.tipo === 'Correctivo' ? styles.correctivo : styles.preventivo}`}></span>
                  <span>{m.activo_nombre}</span>
                </div>
                <span>{m.descripcion}</span>
                <span>{m.tecnico_nombre || 'No asignado'}</span>
                <span>{new Date(m.fecha_programada).toLocaleDateString()}</span>
              </div>
            )) : (
              <p style={{padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)'}}>No hay mantenimientos registrados.</p>
            )}
          </div>
        )}
      </section>

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
                        <select 
                            className={styles.statusSelect}
                            value={detailItem.estado || ''}
                            onChange={(e) => handleUpdateField('estado', e.target.value)}
                        >
                            <option value="Programado">Programado</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Completado">Completado</option>
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
                            {tecnicos.map(t => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.infoBlock}>
                  <label>Descripción del Problema:</label>
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
                    <button 
                        className={`${styles.subTab} ${activeSubTab === 'seguimiento' ? styles.activeSubTab : ''}`}
                        onClick={() => setActiveSubTab('seguimiento')}
                    >
                        <MessageSquare size={16} />
                        Seguimiento
                    </button>
                    <button 
                        className={`${styles.subTab} ${activeSubTab === 'evidencias' ? styles.activeSubTab : ''}`}
                        onClick={() => setActiveSubTab('evidencias')}
                    >
                        <Paperclip size={16} />
                        Evidencias
                    </button>
                    <button 
                        className={`${styles.subTab} ${activeSubTab === 'historial' ? styles.activeSubTab : ''}`}
                        onClick={() => setActiveSubTab('historial')}
                    >
                        <History size={16} />
                        Historial
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
                        <button type="submit" className={styles.saveBtn}>Guardar Seguimiento</button>
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
