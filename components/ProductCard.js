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
    const [lensState, setLensState] = useState({
        show: false,
        x: 0, y: 0,
        bgX: 0, bgY: 0,
        imgW: 0, imgH: 0
    });

    // Config
    const LENS_SIZE = 175; // Reduced from 200 as per "make it a very little small"
    const ZOOM_FACTOR = 3;  // 3x Zoom

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const { width, height } = rect;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Position lens centered on cursor
        const lensX = x - LENS_SIZE / 2;
        const lensY = y - LENS_SIZE / 2;

        // Background position calculation
        // The background image size will be (width * ZOOM) x (height * ZOOM)
        // We want the point (x, y) on the original image to be at the center of the lens (LENS_SIZE/2, LENS_SIZE/2)
        // The point (x, y) maps to (x * ZOOM, y * ZOOM) on the background image.
        // So: bgPos + (x * ZOOM) = LENS_SIZE / 2
        // bgPos = (LENS_SIZE / 2) - (x * ZOOM)

        const bgX = (LENS_SIZE / 2) - (x * ZOOM_FACTOR);
        const bgY = (LENS_SIZE / 2) - (y * ZOOM_FACTOR);

        setLensState({
            show: true,
            x: lensX,
            y: lensY,
            bgX: bgX,
            bgY: bgY,
            imgW: width,
            imgH: height
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
                {/* Main Image */}
                <img
                    src={activeImage.thumbnail}
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

                {/* ZOOM LENS */}
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
