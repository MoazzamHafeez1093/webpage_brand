'use client';

import { useState, useRef } from 'react';
import styles from './page.module.css';

export default function InteractiveImage({ product }) {
    // Ensure images is an array
    const images = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : ['/placeholder.jpg'];

    const [activeIndex, setActiveIndex] = useState(0);
    const [isZooming, setIsZooming] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
    const imageRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!imageRef.current) return;

        const { left, top, width, height } = imageRef.current.getBoundingClientRect();

        // Calculate percentage position
        let x = ((e.clientX - left) / width) * 100;
        let y = ((e.clientY - top) / height) * 100;

        // Clamp values between 0 and 100
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        setZoomPosition({ x, y });
        setIsZooming(true);
    };

    const nextImage = () => {
        setActiveIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className={styles.galleryContainer}>
            {/* Main Image Area */}
            <div
                className={styles.imageWrapper}
                ref={imageRef}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={handleMouseMove}
                onTouchMove={(e) => handleMouseMove(e.touches[0])}
            >
                <img
                    src={images[activeIndex]}
                    alt={`${product.name} - View ${activeIndex + 1}`}
                    className={styles.mainImage}
                />

                {/* Magnifier Lens / Zoom View */}
                <div
                    className={styles.magnifier}
                    style={{
                        opacity: isZooming ? 1 : 0,
                        backgroundImage: `url(${images[activeIndex]})`,
                        backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        backgroundSize: '250%' // Zoom level
                    }}
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                            &#10094;
                        </button>
                        <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                            &#10095;
                        </button>
                    </>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className={styles.thumbnails}>
                    {images.map((img, idx) => (
                        <div
                            key={idx}
                            className={`${styles.thumbnail} ${idx === activeIndex ? styles.activeThumb : ''}`}
                            onClick={() => setActiveIndex(idx)}
                        >
                            <img src={img} alt={`Thumbnail ${idx + 1}`} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
