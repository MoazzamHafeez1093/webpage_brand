'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function ProductActions({ sizes, sizeOptions, isCustom, title, category, phoneNumber, inStock, availableColors = [], colorName = '' }) {
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(colorName || null);

    // Merge sizeOptions (new schema) with sizes (legacy) for display
    const effectiveSizes = sizeOptions && sizeOptions.length > 0
        ? sizeOptions
        : (sizes || []).map(s => ({ size: s, inStock: true }));

    // Build WhatsApp URL dynamically based on selected size
    const buildWaUrl = () => {
        const productUrl = typeof window !== 'undefined' ? window.location.href : '';
        let message = '';
        if (isCustom) {
            message = `Hi, I'd like to order a custom piece.\n\n` +
                `Product: "${title}"\n` +
                `Category: ${category}\n` +
                `Link: ${productUrl}`;
        } else {
            const sizeText = selectedSize ? `\nSize: ${selectedSize}` : '';
            const colorText = selectedColor ? `\nColor: ${selectedColor}` : '';
            message = `Hi, I'd like to place an order.\n\n` +
                `Product: "${title}"\n` +
                `Category: ${category}` +
                `${sizeText}` +
                `${colorText}\n` +
                `Link: ${productUrl}`;
        }
        return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    };

    const isOutOfStock = !isCustom && inStock === false;
    const ctaLabel = isCustom ? 'Get a Price Estimate' : 'Order Via Whatsapp';

    return (
        <>
            {/* Available Colors */}
            {availableColors.length > 0 && (
                <div className={styles.colorsSection}>
                    <span className={styles.label}>
                        {selectedColor ? `Color: ${selectedColor}` : 'Available Colors'}
                    </span>
                    <div className={styles.colorSwatches}>
                        {availableColors.map((color, idx) => (
                            <button
                                key={idx}
                                className={`${styles.colorSwatch} ${selectedColor === color.name ? styles.activeColorSwatch : ''}`}
                                onClick={() => setSelectedColor(selectedColor === color.name ? null : color.name)}
                                title={color.name}
                                style={{ '--swatch-color': color.hexCode || '#ccc' }}
                            />
                        ))}
                    </div>
                </div>
            )}

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
                <a href={buildWaUrl()} target="_blank" rel="noopener noreferrer" className={styles.cta}>
                    {ctaLabel}
                </a>
            )}

            {/* Mobile Sticky CTA */}
            <div className={styles.mobileCta}>
                {isOutOfStock ? (
                    <span className={styles.disabledCtaText}>Currently Unavailable</span>
                ) : (
                    <a href={buildWaUrl()} target="_blank" rel="noopener noreferrer">
                        {ctaLabel}
                    </a>
                )}
            </div>
        </>
    );
}
