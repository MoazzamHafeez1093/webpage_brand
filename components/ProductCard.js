'use client';

import { useState, useRef } from 'react';
import styles from './ProductCard.module.css';

export default function ProductCard({ product, onClick }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Zoom State
    const [isZooming, setIsZooming] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
    const imageRef = useRef(null);

    const {
        title = "Unknown Product",
        price = 0,
        category = "General",
        images = []
    } = product || {};

    // Safety check
    const safeImages = images.length > 0 ? images : [{ thumbnail: '/placeholder.jpg', fullRes: '/placeholder.jpg' }];

    const activeImage = safeImages[currentImageIndex];

    // --- CAROUSEL LOGIC ---
    const handleNext = (e) => {
        e.preventDefault(); // Stop double-tap zoom
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % safeImages.length);
    };

    const handlePrev = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
    };

    // --- ZOOM LOGIC ---
    // Desktop: Hover to zoom. Mobile: Tap to toggle zoom lock.
    const handleUnlocks = () => {
        setIsZooming(false);
    };

    const handleMouseMove = (e) => {
        // Desktop Hover Logic
        if (!imageRef.current) return;
        const { left, top, width, height } = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomPosition({ x, y });
        setIsZooming(true);
    };

    const handleTouchMove = (e) => {
        // Mobile Pan Logic (Only if zooming)
        if (!isZooming || !imageRef.current) return;
        const touch = e.touches[0];
        const { left, top, width, height } = imageRef.current.getBoundingClientRect();

        // Calculate percentage but constrain to 0-100 to prevent jerking
        let x = ((touch.clientX - left) / width) * 100;
        let y = ((touch.clientY - top) / height) * 100;

        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        setZoomPosition({ x, y });
        e.stopPropagation(); // Prevent page scrolling while panning
    };

    const toggleMobileZoom = (e) => {
        // On mobile, tapping toggles the zoom state
        e.stopPropagation();
        // If we are already zooming, tap turns it off.
        // If we are NOT zooming, current tap sets the initial position and turns it on.
        if (isZooming) {
            setIsZooming(false);
        } else {
            // Set initial position to center or touch point
            setZoomPosition({ x: 50, y: 50 });
            setIsZooming(true);
        }
    };

    return (
        <article className={styles.card} onClick={onClick}>
            <div
                className={styles.imageWrapper}
                ref={imageRef}

                // Desktop Mouse Interaction
                onMouseMove={handleMouseMove}
                onMouseLeave={handleUnlocks}

                // Mobile Touch Interaction
                onTouchMove={handleTouchMove}
                onClick={toggleMobileZoom}
            >
                {/* Placeholder (Main Image) */}
                <img
                    src={activeImage.thumbnail}
                    alt={title}
                    className={styles.placeholder}
                    draggable="false"
                />

                {/* Zoom Lens (Overlay) */}
                <div
                    className={styles.zoomLens}
                    style={{
                        opacity: isZooming ? 1 : 0,
                        backgroundImage: `url(${activeImage.fullRes})`,
                        backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        backgroundSize: '250%',
                        pointerEvents: 'none' // Let clicks pass through to container
                    }}
                />

                {/* --- CAROUSEL CONTROLS --- */}
                {safeImages.length > 1 && (
                    <>
                        <button
                            className={styles.navBtnLeft}
                            onClick={handlePrev}
                            onTouchEnd={(e) => { e.preventDefault(); handlePrev(e); }} // Robust touch handling
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
                <div className={styles.price}>${price.toFixed(2)}</div>
            </div>
        </article>
    );
}
