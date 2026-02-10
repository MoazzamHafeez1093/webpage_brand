'use client';

import { useState, useRef } from 'react';
import styles from './ProductCard.module.css';

export default function ProductCard({ product, categoryType, onClick }) {
    // Support new schema (name, collectionRef) and old schema (title, category)
    const title = product?.name || product?.title;
    const category = product?.collectionRef?.name || product?.category;
    // Normalize businessType: check explicit field or infer from category/product
    const isCustom = product?.businessType === 'custom' || categoryType === 'custom' || category === 'custom';

    const { price, description, images, inspirationImage } = product || {};
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [showInspiration, setShowInspiration] = useState(false); // Toggle state

    // Safety check for images & normalize format
    const safeImages = images && images.length > 0
        ? images.map(img => typeof img === 'string' ? { thumbnail: img, fullRes: img } : img)
        : [{ thumbnail: '/placeholder.jpg', fullRes: '/placeholder.jpg' }];
    const activeImage = safeImages[currentImageIndex];

    // ... (rest of state logic)

    // --- GRID ZOOM LENS LOGIC ---
    // ... (Keep existing lens state & config)
    const [lensState, setLensState] = useState({
        show: false,
        x: 0, y: 0,
        bgX: 0, bgY: 0,
        imgW: 0, imgH: 0
    });
    const LENS_SIZE = 175;
    const ZOOM_FACTOR = 3;

    // ... (Keep handleMouseMove/TouchMove logic) ...
    const handleMouseMove = (e) => {
        // ... (existing logic)
        const rect = e.currentTarget.getBoundingClientRect();
        const { width, height } = rect;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const lensX = x - LENS_SIZE / 2;
        const lensY = y - LENS_SIZE / 2;
        const bgX = (LENS_SIZE / 2) - (x * ZOOM_FACTOR);
        const bgY = (LENS_SIZE / 2) - (y * ZOOM_FACTOR);
        setLensState({ show: true, x: lensX, y: lensY, bgX, bgY, imgW: width, imgH: height });
    };

    const handleTouchMove = (e) => {
        // ... (existing logic)
        if (e.cancelable) e.preventDefault();
        const touch = e.touches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        const { width, height } = rect;
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        if (x < 0 || y < 0 || x > width || y > height) { setLensState(prev => ({ ...prev, show: false })); return; }
        const OFFSET_Y = 120;
        const lensX = x - LENS_SIZE / 2;
        const lensY = y - LENS_SIZE / 2 - OFFSET_Y;
        const bgX = (LENS_SIZE / 2) - (x * ZOOM_FACTOR);
        const bgY = (LENS_SIZE / 2) - (y * ZOOM_FACTOR);
        setLensState({ show: true, x: lensX, y: lensY, bgX, bgY, imgW: width, imgH: height });
    };

    const handleMouseLeave = () => {
        setLensState(prev => ({ ...prev, show: false }));
    };

    // --- CAROUSEL LOGIC ---
    // ... (Keep handleNext/Prev) ...
    const handleNext = (e) => {
        e.preventDefault(); e.stopPropagation(); setImgLoaded(false);
        setCurrentImageIndex((prev) => (prev + 1) % safeImages.length);
    };
    const handlePrev = (e) => {
        e.preventDefault(); e.stopPropagation(); setImgLoaded(false);
        setCurrentImageIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
    };

    // WhatsApp Logic (Contextual)
    const handleWhatsApp = (e) => {
        e.stopPropagation();
        const phoneNumber = '923211234567';

        // Contextual Message
        let message = '';
        const currentImgUrl = activeImage.fullRes || activeImage.thumbnail;

        if (isCustom) {
            message = `Hi, I'm interested in a price estimate for a design like "${title}".\nRef Image: ${currentImgUrl}`;
        } else {
            message = `Hi, I would like to check size availability for "${title}" (${category}).\nRef Image: ${currentImgUrl}`;
        }

        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <article className={styles.card} onClick={onClick}>
            {/* INSPIRATION TOGGLE (For Custom Only) */}
            {isCustom && inspirationImage && (
                <div className={styles.toggleWrapper}>
                    <button
                        className={showInspiration ? styles.toggleBtnActive : styles.toggleBtn}
                        onClick={(e) => { e.stopPropagation(); setShowInspiration(!showInspiration); }}
                    >
                        {showInspiration ? 'Show Result' : 'View Inspiration'}
                    </button>
                </div>
            )}

            <div
                className={styles.imageWrapper}
                onMouseMove={!showInspiration ? handleMouseMove : null} // Disable zoom on inspiration for simplicity? Or keep it. Let's keep it simple.
                onMouseLeave={handleMouseLeave}
                onTouchStart={!showInspiration ? handleTouchMove : null}
                onTouchMove={!showInspiration ? handleTouchMove : null}
                onTouchEnd={handleMouseLeave}
            >
                {/* Main Image OR Inspiration Image */}
                <img
                    src={showInspiration ? inspirationImage : activeImage.thumbnail}
                    alt={title}
                    className={styles.placeholder}
                    draggable="false"
                    loading="lazy"
                    onLoad={() => setImgLoaded(true)}
                    onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                    style={{
                        opacity: 1,
                        transition: 'transform 1.2s cubic-bezier(0.19, 1, 0.22, 1)'
                    }}
                />

                {/* ZOOM LENS (Only on Main Image) */}
                {!showInspiration && (
                    <div
                        className={styles.zoomLens}
                        style={{
                            display: lensState.show ? 'block' : 'none',
                            left: `${lensState.x}px`,
                            top: `${lensState.y}px`,
                            width: `${LENS_SIZE}px`,
                            height: `${LENS_SIZE}px`,
                            backgroundImage: `url(${activeImage.thumbnail})`,
                            backgroundSize: `${lensState.imgW * ZOOM_FACTOR}px ${lensState.imgH * ZOOM_FACTOR}px`,
                            backgroundPosition: `${lensState.bgX}px ${lensState.bgY}px`
                        }}
                    />
                )}

                {/* --- CAROUSEL CONTROLS (Only show if multiple images AND not viewing inspiration) --- */}
                {!showInspiration && safeImages.length > 1 && (
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

                {/* Side-by-Side Label */}
                {showInspiration && (
                    <div className={styles.inspirationLabel}>Original Concept</div>
                )}
            </div>

            <div className={styles.info}>
                <div className={styles.category}>
                    {isCustom ? "Custom Couture" : "Retail Collection"} • {category}
                </div>
                <h3 className={styles.title}>{title}</h3>
                {/* Hide price for Custom, show for Retail */}
                {!isCustom && <div className={styles.price}>${typeof price === 'number' ? price.toFixed(2) : price}</div>}

                <button onClick={handleWhatsApp} className={styles.whatsappBtn}>
                    <span>{isCustom ? "Get a Price Estimate" : "Check Size Availability"}</span>
                </button>
            </div>
        </article>
    );
}
