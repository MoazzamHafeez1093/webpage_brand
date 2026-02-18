'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CollectionNavigator.module.css';

const CollectionNavigator = ({ categories, onClose }) => {
    const [expandedCollections, setExpandedCollections] = useState({});
    const router = useRouter();

    const toggleExpand = (id) => {
        setExpandedCollections(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const navigateToCollection = (slug) => {
        if (slug === 'all') {
            router.push('/');
        } else {
            router.push(`/shop/${slug}`);
        }

        if (onClose) onClose();
    };

    const CollectionItem = ({ collection, level = 0 }) => {
        const isExpanded = expandedCollections[collection._id];
        const hasChildren = collection.children && collection.children.length > 0;

        return (
            <div className={styles.itemWrapper}>
                <div
                    className={styles.row}
                    style={{ paddingLeft: `${level * 20 + 10}px` }}
                >
                    {hasChildren ? (
                        <button
                            className={styles.arrowBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(collection._id);
                            }}
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                            {isExpanded ? '\u25BC' : '\u25B6'}
                        </button>
                    ) : (
                        <span style={{ width: '24px', display: 'inline-block' }}></span>
                    )}

                    <button
                        className={styles.nameBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigateToCollection(collection.slug);
                        }}
                    >
                        {collection.name}
                    </button>
                </div>

                {hasChildren && isExpanded && (
                    <div className={styles.children}>
                        {collection.children.map(child => (
                            <CollectionItem
                                key={child._id}
                                collection={child}
                                level={level + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.container} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
                <h2 className={styles.title}>Collections</h2>
                <button onClick={onClose} className={styles.closeBtn}>Close</button>
            </div>

            <div className={styles.content}>
                <button
                    className={styles.sectionLabel}
                    onClick={() => navigateToCollection('all')}
                >
                    All Collections
                </button>

                <div className={styles.list}>
                    {categories && categories.map(cat => (
                        <CollectionItem key={cat._id} collection={cat} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CollectionNavigator;
