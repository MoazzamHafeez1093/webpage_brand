'use client';

import { useState, useRef } from 'react';
import styles from './ProductCard.module.css';

export default function ProductCard({ product, categoryType, onClick }) {
    const { title, price, description, category, images } = product || {};
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imgLoaded, setImgLoaded] = useState(false);

    // Safety check for images
    const safeImages = images && images.length > 0 ? images : [{ thumbnail: '/placeholder.jpg', fullRes: '/placeholder.jpg' }];
    const activeImage = safeImages[currentImageIndex];

    // Reset load state when image changes
    if (activeImage !== safeImages[currentImageIndex]) {
        // This is a bit risky in render, but safe if we are just deriving state. 
        // Better to handle in the handlers.
    }

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
            <div className={styles.imageWrapper}>
                {/* Main Image - CSS Transform handles zoom now */}
                <img
                    src={activeImage.thumbnail}
                    alt={title}
                    className={styles.placeholder}
                    draggable="false"
                    loading="lazy"
                    onLoad={() => setImgLoaded(true)}
                    style={{
                        opacity: imgLoaded ? 1 : 0,
                        transition: 'opacity 0.8s ease-out, transform 1.2s cubic-bezier(0.19, 1, 0.22, 1)'
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
