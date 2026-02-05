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
        e.stopPropagation(); // Don't trigger card click
        setCurrentImageIndex((prev) => (prev + 1) % safeImages.length);
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
    };

    // --- ZOOM LOGIC ---
    const handleMouseMove = (e) => {
        // If hovering over buttons/dots, don't zoom
        if (e.target.tagName === 'BUTTON' || e.target.classList.contains(styles.dot)) {
            setIsZooming(false);
            return;
        }

        if (!imageRef.current) return;
        const { left, top, width, height } = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomPosition({ x, y });
        setIsZooming(true);
    };

    return (
        <article className={styles.card} onClick={onClick}>
            <div
                className={styles.imageWrapper}
                ref={imageRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setIsZooming(false)}
                onTouchMove={(e) => handleMouseMove(e.touches[0])}
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
                        backgroundSize: '250%'
                    }}
                />

                {/* --- CAROUSEL CONTROLS --- */}
                {safeImages.length > 1 && (
                    <>
                        <button className={styles.navBtnLeft} onClick={handlePrev} onMouseEnter={() => setIsZooming(false)}>‹</button>
                        <button className={styles.navBtnRight} onClick={handleNext} onMouseEnter={() => setIsZooming(false)}>›</button>

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
