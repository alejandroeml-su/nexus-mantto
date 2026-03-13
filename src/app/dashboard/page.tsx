'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Box, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ArrowRight
} from 'lucide-react';
import StatsCard from '@/components/Dashboard/StatsCard';
import { getActivos, getMantenimientos } from '@/lib/actions';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  const [stats, setStats] = useState({ activos: 0, mantenimientos: 0, alertas: 0, eficiencia: '0h' });
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      const [activos, mantenimientos] = await Promise.all([getActivos(), getMantenimientos()]);
      setStats({
        activos: activos.length,
        mantenimientos: mantenimientos.filter((m: any) => m.estado === 'Programado').length,
        alertas: activos.filter((a: any) => a.estado === 'Fuera de Servicio').length,
        eficiencia: '2.5h' // Mocked KPI
      });
      setTasks(mantenimientos.slice(0, 5));
    }
    loadStats();
  }, []);

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Panel de Control</h1>
          <p className={styles.subtitle}>Bienvenido al sistema NEXUS 4.0. Resumen de operaciones en tiempo real.</p>
        </div>
        <div className={styles.date}>
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </header>

      <section className={styles.statsGrid}>
        <StatsCard 
          label="Total Activos" 
          value={stats.activos} 
          icon={Box} 
          trend={{ value: '0%', isUp: true }}
          href="/activos"
        />
        <StatsCard 
          label="Mantenimientos Pendientes" 
          value={stats.mantenimientos} 
          icon={Settings} 
          href="/seguimiento"
        />
        <StatsCard 
          label="Alertas Críticas" 
          value={stats.alertas} 
          icon={AlertTriangle} 
          trend={{ value: 'Normativo', isUp: true }}
          href="/activos?estado=Fuera de Servicio"
        />
        <StatsCard 
          label="Eficiencia (MTTR)" 
          value={stats.eficiencia} 
          icon={CheckCircle2} 
        />
      </section>

      <div className={styles.mainGrid}>
        <section className={`${styles.section} glass`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Kanban Operativo</h2>
            <Link href="/seguimiento" className={styles.viewAll}>
              Expandir Kanban <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.miniKanban}>
            <div className={styles.kanbanCol}>
              <h3 className={styles.colTitle}>Pendientes</h3>
              {tasks.filter((t: any) => t.estado === 'Programado').slice(0, 3).map((task: any) => (
                <div key={task.id} className={styles.miniCard}>
                  <span>{task.activo_nombre}</span>
                  <p>{task.prioridad || 'Media'}</p>
                </div>
              ))}
            </div>
            <div className={styles.kanbanCol}>
              <h3 className={styles.colTitle}>En Proceso</h3>
              {tasks.filter((t: any) => t.estado === 'En Proceso').slice(0, 3).map((task: any) => (
                <div key={task.id} className={`${styles.miniCard} ${styles.inProgress}`}>
                  <span>{task.activo_nombre}</span>
                  <p>{task.prioridad || 'Media'}</p>
                </div>
              ))}
            </div>
            <div className={styles.kanbanCol}>
              <h3 className={styles.colTitle}>Completado</h3>
              {tasks.filter((t: any) => t.estado === 'Completado').slice(0, 3).map((task: any) => (
                <div key={task.id} className={`${styles.miniCard} ${styles.done}`}>
                  <span>{task.activo_nombre}</span>
                  <p>{task.prioridad || 'Media'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} glass`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Estado de la Flota</h2>
          </div>
          <div className={styles.healthChart}>
            {/* Simple CSS-based health bar */}
            <div className={styles.progressGroup}>
              <div className={styles.progressHeader}>
                <span>Operativo</span>
                <span>85%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '85%', background: 'var(--success)' }}></div>
              </div>
            </div>
            <div className={styles.progressGroup}>
              <div className={styles.progressHeader}>
                <span>Mantenimiento</span>
                <span>10%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '10%', background: 'var(--warning)' }}></div>
              </div>
            </div>
            <div className={styles.progressGroup}>
              <div className={styles.progressHeader}>
                <span>Fuera de Servicio</span>
                <span>5%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '5%', background: 'var(--danger)' }}></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
