'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../app/page.module.css';

// Recursive Dropdown Item
const DropdownItem = ({ category, onSelect }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = category.children && category.children.length > 0;

    const handleClick = (e) => {
        e.stopPropagation();
        if (hasChildren) {
            setIsExpanded(!isExpanded);
        } else {
            onSelect(category.slug);
        }
    };

    return (
        <div className={styles.navItem}>
            <button
                className={styles.dropdownBtn}
                onClick={handleClick}
                style={{ paddingLeft: isExpanded ? '0.5rem' : '0' }}
            >
                {category.name} {hasChildren && (isExpanded ? '▼' : '▶')}
            </button>
            {hasChildren && isExpanded && (
                <div className={styles.nestedDropdown}>
                    {category.children.map(child => (
                        <DropdownItem key={child._id} category={child} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Navbar({ categories }) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleSelect = (slug) => {
        setIsOpen(false);
        if (slug === 'all') router.push('/');
        else router.push(`/shop/${slug}`);
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.navContainer}>
                <span className={styles.brand} onClick={() => router.push('/')}>LUXE.</span>

                <div className={styles.menuWrapper}>
                    <button className={styles.menuBtn} onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? 'Close' : 'Collections'}
                    </button>

                    {isOpen && (
                        <div className={styles.dropdown}>
                            <button onClick={() => handleSelect('all')} className={styles.dropdownBtn}>All Items</button>
                            {/* Render Top Level Categories */}
                            {categories && categories.map(cat => (
                                <DropdownItem key={cat._id} category={cat} onSelect={handleSelect} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
