'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getCloudinaryUrl } from '@/lib/cloudinary';
import styles from './ProductCard.module.css';

export default function ProductCard({ product, categoryType }) {
    // Support new schema (name, collectionRef) and old schema (title, category)
    const title = product?.name || product?.title;
    const category = product?.collectionRef?.name || product?.category;
    // Normalize businessType: check explicit field or infer from category/product
    const isCustom = product?.businessType === 'custom' || categoryType === 'custom' || category === 'custom';

    const { price, images, inspirationImage, inStock, isOutOfStock } = product || {};
    const outOfStock = !isCustom && (isOutOfStock === true || inStock === false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [showInspiration, setShowInspiration] = useState(false);



    // Safety check for images & normalize format
    const safeImages = images && images.length > 0
        ? images.map(img => typeof img === 'string' ? { thumbnail: img, fullRes: img } : img)
        : [{ thumbnail: '/placeholder.jpg', fullRes: '/placeholder.jpg' }];
    const activeImage = safeImages[currentImageIndex];

    // --- CAROUSEL LOGIC ---
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
        e.preventDefault();
        const phoneNumber = '923346202291';

        let message = '';
        const currentImgUrl = activeImage.fullRes || activeImage.thumbnail;

        if (isCustom) {
            message = `Hi, I'm interested in a price estimate for a design like "${title}".\nRef Image: ${currentImgUrl}`;
        } else {
            message = `Hi, I would like to check size availability for "${title}" (${category}).\nRef Image: ${currentImgUrl}`;
        }

        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Build the product detail URL
    const productUrl = `/product/${product?._id}`;

    return (
        <Link href={productUrl} className={styles.cardLink}>
            <article className={styles.card}>
                {/* INSPIRATION TOGGLE (For Custom Only) */}
                {isCustom && inspirationImage && (
                    <div className={styles.toggleWrapper}>
                        <button
                            className={showInspiration ? styles.toggleBtnActive : styles.toggleBtn}
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowInspiration(!showInspiration); }}
                        >
                            {showInspiration ? 'Show Result' : 'View Inspiration'}
                        </button>
                    </div>
                )}

                <div className={styles.imageWrapper}>
                    {/* Out of Stock Badge */}
                    {outOfStock && (
                        <span className={styles.outOfStockBadge}>Out of Stock</span>
                    )}
                    {/* Main Image OR Inspiration Image */}
                    <Image
                        src={getCloudinaryUrl(
                            showInspiration ? inspirationImage : activeImage.thumbnail,
                            { width: 600, quality: 75 }
                        )}
                        alt={title || 'Product image'}
                        fill
                        sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className={styles.placeholder}
                        draggable={false}
                        loading="lazy"
                        onLoad={() => setImgLoaded(true)}
                        onError={() => setImgLoaded(true)}
                        style={{
                            opacity: imgLoaded ? 1 : 0,
                            objectFit: 'var(--card-img-fit, cover)',
                            transition: 'opacity 0.4s ease-in-out'
                        }}
                    />

                    {/* --- CAROUSEL CONTROLS (Only show if multiple images AND not viewing inspiration) --- */}
                    {!showInspiration && safeImages.length > 1 && (
                        <>
                            <button
                                className={styles.navBtnLeft}
                                onClick={handlePrev}
                                onTouchEnd={(e) => { e.preventDefault(); handlePrev(e); }}
                            >&#8249;</button>
                            <button
                                className={styles.navBtnRight}
                                onClick={handleNext}
                                onTouchEnd={(e) => { e.preventDefault(); handleNext(e); }}
                            >&#8250;</button>

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
                        {isCustom ? "Custom Couture" : "Retail Collection"} &bull; {category}
                    </div>
                    <h3 className={styles.title}>{title}</h3>
                    <div className={styles.price}>
                        {!isCustom && price != null ? `Rs. ${typeof price === 'number' ? price.toLocaleString() : price}` : '\u00A0'}
                    </div>

                    <button onClick={handleWhatsApp} className={styles.whatsappBtn}>
                        <span>{isCustom ? "Get a Price Estimate" : "Order Via Whatsapp"}</span>
                    </button>
                </div>
            </article>
        </Link>
    );
}
