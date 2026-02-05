'use client';

import { useState, useRef } from 'react';
import styles from './page.module.css';

export default function InteractiveImage({ product }) {
    const [isZooming, setIsZooming] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
    const imageRef = useRef(null);

    const image = product.images[0];

    const handleMouseMove = (e) => {
        if (!imageRef.current) return;

        const { left, top, width, height } = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;

        setZoomPosition({ x, y });
        setIsZooming(true);
    };

    return (
        <div
            className={styles.imageWrapper}
            ref={imageRef}
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onMouseMove={handleMouseMove}
            onTouchMove={(e) => handleMouseMove(e.touches[0])}
        >
            <img src={image.thumbnail} alt={product.title} className={styles.mainImage} />

            <div
                className={styles.magnifier}
                style={{
                    opacity: isZooming ? 1 : 0,
                    backgroundImage: `url(${image.fullRes})`,
                    backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    backgroundSize: '200%' // Zoom level
                }}
            />
        </div>
    );
}
