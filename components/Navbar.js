'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../app/page.module.css';

// Recursive Dropdown Item
const DropdownItem = ({ category, onSelect }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = category.children && category.children.length > 0;

    const handleTextClick = (e) => {
        e.stopPropagation();
        onSelect(category.slug);
    };

    const handleArrowClick = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={styles.navItem}>
            <div className={styles.navRow}>
                {/* Text CLick -> Selects Category */}
                <span className={styles.navText} onClick={handleTextClick}>
                    {category.name}
                </span>

                {/* Arrow Click -> Toggles Dropdown (only if children exist) */}
                {hasChildren && (
                    <span
                        className={`${styles.navArrow} ${isExpanded ? styles.arrowExpanded : ''}`}
                        onClick={handleArrowClick}
                    >
                        ▼
                    </span>
                )}
            </div>

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
        else router.push(`/?collection=${slug}`);
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
