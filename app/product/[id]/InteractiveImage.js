'use client';

import { useState, useRef } from 'react';
import styles from './page.module.css';

export default function InteractiveImage({ product }) {
    // Ensure images is an array
    const images = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : ['/placeholder.jpg'];

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
            >
                <img
                    src={images[activeIndex]}
                    alt={`${product.name} - View ${activeIndex + 1}`}
                    className={styles.mainImage}
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
