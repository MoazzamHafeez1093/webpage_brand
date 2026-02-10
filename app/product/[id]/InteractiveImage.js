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
    const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
    const imageRef = useRef(null);
    const modalImageRef = useRef(null);

    // Loupe State
    const [loupeState, setLoupeState] = useState({
        x: 0,
        y: 0,
        bgX: 0,
        bgY: 0,
        show: false,
        imgW: 0, // Track dimensions for accurate zoom
        imgH: 0
    });
    const LOUPE_SIZE = 200; // Match CSS
    const ZOOM_LEVEL = 2.5; // magnification factor

    // Loupe Zoom Handler
    const handleMouseMove = (e) => {
        if (!imageRef.current) return;
        const { left, top, width, height } = imageRef.current.getBoundingClientRect();

        // Cursor position relative to image
        const x = e.clientX - left;
        const y = e.clientY - top;

        // Check bounds
        if (x < 0 || y < 0 || x > width || y > height) {
            setLoupeState(prev => ({ ...prev, show: false }));
            return;
        }

        // Loupe Position (Centered on cursor)
        let loupeX = x - LOUPE_SIZE / 2;
        let loupeY = y - LOUPE_SIZE / 2;

        // Background Position calculation
        const bgX = ((x / width) * 100);
        const bgY = ((y / height) * 100);

        setLoupeState({
            x: loupeX,
            y: loupeY,
            bgX: bgX,
            bgY: bgY,
            show: true,
            imgW: width,
            imgH: height
        });
    };

    const nextImage = () => {
        setActiveIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    const handleModalMouseMove = (e) => {
        if (!modalImageRef.current) return;
        const { left, top, width, height } = modalImageRef.current.getBoundingClientRect();
        let x = ((e.clientX - left) / width) * 100;
        let y = ((e.clientY - top) / height) * 100;
        modalImageRef.current.style.transformOrigin = `${x}% ${y}%`;
    };

    return (
        <>
            <div className={styles.galleryContainer}>
                {/* Main Image Area */}
                <div
                    className={styles.imageWrapper}
                    ref={imageRef}
                    onMouseEnter={() => setLoupeState(prev => ({ ...prev, show: true }))}
                    onMouseLeave={() => setLoupeState(prev => ({ ...prev, show: false }))}
                    onMouseMove={handleMouseMove}
                    onTouchMove={(e) => handleMouseMove(e.touches[0])}
                    onClick={toggleModal}
                    title="Click for Full Screen"
                >
                    <img
                        src={images[activeIndex]}
                        alt={`${product.name} - View ${activeIndex + 1}`}
                        className={styles.mainImage}
                        style={{ cursor: 'crosshair' }}
                    />

                    {/* Square Loupe Lens */}
                    <div
                        className={styles.magnifier}
                        style={{
                            display: loupeState.show ? 'block' : 'none',
                            top: `${loupeState.y}px`,
                            left: `${loupeState.x}px`,
                            backgroundImage: `url(${images[activeIndex]})`,
                            // CRITICAL FIX: Background size based on MAIN IMAGE dimensions * ZOOM
                            backgroundSize: `${loupeState.imgW * ZOOM_LEVEL}px ${loupeState.imgH * ZOOM_LEVEL}px`,
                            backgroundPosition: `${loupeState.bgX}% ${loupeState.bgY}%`
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

            {/* FULL SCREEN MODAL */}
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={toggleModal}>
                    <button className={styles.closeBtn} onClick={toggleModal}>×</button>
                    <div
                        className={styles.modalContent}
                        onMouseMove={handleModalMouseMove}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            ref={modalImageRef}
                            src={images[activeIndex]}
                            alt="Full Screen Zoom"
                            className={styles.modalImage}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
