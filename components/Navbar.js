'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../app/page.module.css';
import CollectionNavigator from './CollectionNavigator';

export default function Navbar({ categories }) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    return (
        <nav className={styles.navbar}>
            <div className={styles.navContainer}>
                <img
                    src="/hoa-logo.png"
                    alt="House of Aslam"
                    className={styles.brandLogo}
                    onClick={() => router.push('/')}
                />

                <div className={styles.menuWrapper}>
                    <button className={styles.menuBtn} onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? 'Close' : 'Collections'}
                    </button>

                    {isOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '120%',
                            right: 0,
                            zIndex: 200
                        }}>
                            <CollectionNavigator
                                categories={categories}
                                onClose={() => setIsOpen(false)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
