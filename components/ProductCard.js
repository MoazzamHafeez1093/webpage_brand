'use client';

import { useState, useRef } from 'react';
import styles from './ProductCard.module.css';

export default function ProductCard({ product, categoryType, onClick }) {
    // Support new schema (name, collectionRef) and old schema (title, category)
    const title = product?.name || product?.title;
    const category = product?.collectionRef?.name || product?.category;
    const { price, description, images } = product || {};
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imgLoaded, setImgLoaded] = useState(false);

    // Safety check for images & normalize format
    const safeImages = images && images.length > 0
        ? images.map(img => typeof img === 'string' ? { thumbnail: img, fullRes: img } : img)
        : [{ thumbnail: '/placeholder.jpg', fullRes: '/placeholder.jpg' }];
    const activeImage = safeImages[currentImageIndex];

    // Reset load state when image changes
    if (activeImage !== safeImages[currentImageIndex]) {
        // This is a bit risky in render, but safe if we are just deriving state. 
        // Better to handle in the handlers.
    }

    // --- GRID ZOOM LENS LOGIC ---
    const [lensState, setLensState] = useState({ show: false, x: 0, y: 0, bgX: 0, bgY: 0 });
    const LENS_SIZE = 150; // px
    const ZOOM_FACTOR = 3; // 300%

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Position lens centered on cursor
        // We subtract half lens size to center it
        // We clamp it? User didn't strictly ask for clamping but it looks better if lens doesn't fly off too much.
        // For simplicity and fluid feel, let's just center it.

        // Background position:
        // We need to show the area under the cursor (x, y)
        // If bg size is 300% (3x), then 1px in container = 3px in bg.
        // We need to shift bg so that (x*3, y*3) is at the center of the lens.
        // Formula: - (x * zoom - lensW/2)

        const bgX = -((x * ZOOM_FACTOR) - LENS_SIZE / 2);
        const bgY = -((y * ZOOM_FACTOR) - LENS_SIZE / 2);

        setLensState({
            show: true,
            x: x - LENS_SIZE / 2,
            y: y - LENS_SIZE / 2,
            bgX: bgX,
            bgY: bgY
        });
    };

    const handleMouseLeave = () => {
        setLensState(prev => ({ ...prev, show: false }));
    };

    // --- CAROUSEL LOGIC ---
    const handleNext = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setImgLoaded(false);
        setCurrentImageIndex((prev) => (prev + 1) % safeImages.length);
    };

    const handlePrev = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setImgLoaded(false);
        setCurrentImageIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
    };

    // WhatsApp Logic
    const handleWhatsApp = (e) => {
        e.stopPropagation();
        const phoneNumber = '923211234567'; // Replace with real number or env variable
        const isCustom = categoryType === 'custom' || product?.categoryType === 'custom' || category === 'custom';

        let message = '';
        if (isCustom) {
            message = `Hi, I'm interested in a price estimate for a design like "${title}".`;
        } else {
            message = `Hi, I would like to check size availability for "${title}" (${category}).`;
        }

        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <article className={styles.card} onClick={onClick}>
            <div
                className={styles.imageWrapper}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* Main Image - CSS Transform handles zoom now */}
                <img
                    src={activeImage.thumbnail}
                    alt={title}
                    className={styles.placeholder}
                    draggable="false"
                    loading="lazy"
                    onLoad={() => setImgLoaded(true)}
                    onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                    style={{
                        opacity: 1, // Force visible
                        transition: 'transform 1.2s cubic-bezier(0.19, 1, 0.22, 1)'
                    }}
                />

                {/* ZOOM LENS */}
                <div
                    className={styles.zoomLens}
                    style={{
                        display: lensState.show ? 'block' : 'none',
                        left: `${lensState.x}px`,
                        top: `${lensState.y}px`,
                        backgroundImage: `url(${activeImage.thumbnail})`,
                        backgroundPosition: `${lensState.bgX}px ${lensState.bgY}px`
                    }}
                />

                {/* --- CAROUSEL CONTROLS (Only show if multiple images) --- */}
                {safeImages.length > 1 && (
                    <>
                        <button
                            className={styles.navBtnLeft}
                            onClick={handlePrev}
                            onTouchEnd={(e) => { e.preventDefault(); handlePrev(e); }}
                        >‹</button>
                        <button
                            className={styles.navBtnRight}
                            onClick={handleNext}
                            onTouchEnd={(e) => { e.preventDefault(); handleNext(e); }}
                        >›</button>

                        {/* Dots */}
                        <div className={styles.dots}>
                            {safeImages.map((_, idx) => (
                                <span key={idx} className={idx === currentImageIndex ? styles.dotActive : styles.dot}></span>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className={styles.info}>
                <div className={styles.category}>{category}</div>
                <h3 className={styles.title}>{title}</h3>
                <div className={styles.price}>${typeof price === 'number' ? price.toFixed(2) : price}</div>

                <button onClick={handleWhatsApp} className={styles.whatsappBtn}>
                    <span>Inquire via WhatsApp</span>
                </button>
            </div>
        </article>
    );
}
