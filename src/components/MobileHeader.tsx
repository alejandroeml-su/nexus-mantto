'use client';

import React, { useState } from 'react';
import { Menu, X, Activity } from 'lucide-react';
import Sidebar from './Sidebar';
import styles from './MobileHeader.module.css';

export default function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className={styles.mobileHeader}>
        <div className={styles.logo}>
          <Activity size={24} />
          <span>NEXUS 4.0</span>
        </div>
        <button className={styles.menuBtn} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {isOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsOpen(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <Sidebar mobile={true} />
          </div>
        </div>
      )}
    </>
  );
}
