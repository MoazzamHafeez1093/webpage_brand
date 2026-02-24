'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function ProductActions({ sizes, sizeOptions, isCustom, title, category, phoneNumber, currentImgUrl, inStock }) {
    const [selectedSize, setSelectedSize] = useState(null);

    // Merge sizeOptions (new schema) with sizes (legacy) for display
    const effectiveSizes = sizeOptions && sizeOptions.length > 0
        ? sizeOptions
        : (sizes || []).map(s => ({ size: s, inStock: true }));

    // Build WhatsApp URL dynamically based on selected size
    const buildWaUrl = () => {
        let message = '';
        if (isCustom) {
            message = `Hi, I'm interested in a price estimate for a design like "${title}".\nRef Image: ${currentImgUrl}`;
        } else {
            const sizeText = selectedSize ? ` in size ${selectedSize}` : '';
            message = `Hi, I would like to check size availability for "${title}"${sizeText} (${category}).\nRef Image: ${currentImgUrl}`;
        }
        return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    };

    const isOutOfStock = !isCustom && inStock === false;
    const ctaLabel = isCustom ? 'Get a Price Estimate' : 'Check Size Availability';

    return (
        <>
            {/* Sizes (for retail products) */}
            {!isCustom && effectiveSizes.length > 0 && (
                <div className={styles.sizesSection}>
                    <span className={styles.label}>
                        {selectedSize ? `Selected: ${selectedSize}` : 'Select Size'}
                    </span>
                    <div className={styles.sizeList}>
                        {effectiveSizes.map(opt => (
                            <button
                                key={opt.size}
                                className={`${styles.sizeBtn} ${selectedSize === opt.size ? styles.activeSizeBtn : ''} ${!opt.inStock ? styles.disabledSizeBtn : ''}`}
                                onClick={() => opt.inStock && setSelectedSize(selectedSize === opt.size ? null : opt.size)}
                                disabled={!opt.inStock}
                                title={!opt.inStock ? 'Out of stock' : ''}
                            >
                                {opt.size}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Desktop CTA */}
            {isOutOfStock ? (
                <span className={styles.disabledCta}>Currently Unavailable</span>
            ) : (
                <a href={buildWaUrl()} target="_blank" className={styles.cta}>
                    {ctaLabel}
                </a>
            )}

            {/* Mobile Sticky CTA */}
            <div className={styles.mobileCta}>
                {isOutOfStock ? (
                    <span className={styles.disabledCtaText}>Currently Unavailable</span>
                ) : (
                    <a href={buildWaUrl()} target="_blank">
                        {ctaLabel}
                    </a>
                )}
            </div>
        </>
    );
}
