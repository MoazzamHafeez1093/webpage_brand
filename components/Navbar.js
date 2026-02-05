'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../app/page.module.css';

export default function Navbar({ categories }) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleSelect = (cat) => {
        setIsOpen(false);
        if (cat === 'All') router.push('/');
        else router.push(`/?category=${cat}`);
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.navContainer}>
                <span className={styles.brand} onClick={() => router.push('/')}>LUXE.</span>

                <div className={styles.menuWrapper}>
                    <button className={styles.menuBtn} onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? 'Close' : 'Categories'}
                    </button>

                    {isOpen && (
                        <div className={styles.dropdown}>
                            <button onClick={() => handleSelect('All')}>All Collection</button>
                            {categories.map(cat => (
                                <button key={cat} onClick={() => handleSelect(cat)}>{cat}</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
