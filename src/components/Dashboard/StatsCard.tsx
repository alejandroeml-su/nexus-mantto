import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
}

export default function StatsCard({ label, value, icon: Icon, trend, href }: StatsCardProps) {
  const CardContent = (
    <>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <div className={styles.iconWrapper}>
          <Icon size={20} />
        </div>
      </div>
      <div className={styles.value}>{value}</div>
      {trend && (
        <div className={`${styles.trend} ${trend.isUp ? styles.up : styles.down}`}>
          <span>{trend.value}</span>
          <span>{trend.isUp ? '↑' : '↓'}</span>
          <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>vs mes pasado</span>
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${styles.card} ${styles.linkCard} glass`}>
        {CardContent}
      </Link>
    );
  }

  return (
    <div className={`${styles.card} glass`}>
      {CardContent}
    </div>
  );
}
