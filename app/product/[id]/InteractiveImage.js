'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './page.module.css';

export default function InteractiveImage({ product }) {
    const [activeIndex, setActiveIndex] = useState(0);

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
            <div className={styles.mainImageWrap}>
                <Image
                    src={images[activeIndex]}
                    alt={`${product.name} - View ${activeIndex + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={styles.mainImage}
                    priority
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

                {/* Image Counter */}
                {images.length > 1 && (
                    <span className={styles.imageCounter}>
                        {activeIndex + 1} of {images.length}
                    </span>
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
                            <Image src={img} alt={`Thumbnail ${idx + 1}`} fill sizes="68px" style={{ objectFit: 'cover' }} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
