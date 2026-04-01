'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css';

/**
 * Returns the Cloudinary video poster URL (a JPEG snapshot of frame 0).
 * Cloudinary auto-generates this — just swap /video/upload/ → /video/upload/so_0/
 * and change the extension to .jpg.
 */
function getVideoPoster(videoUrl) {
    if (!videoUrl || !videoUrl.includes('res.cloudinary.com')) return '';
    return videoUrl
        .replace('/video/upload/', '/video/upload/so_0,w_400,q_60/')
        .replace(/\.(mp4|mov|webm|avi)$/i, '.jpg');
}

export default function InteractiveImage({ product }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const videoRef = useRef(null);

    const images = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : ['/placeholder.jpg'];

    const videos = Array.isArray(product.videos) ? product.videos : [];
    const videoPosition = product.videoPosition || 'after';
    const videoAutoplay = product.videoAutoplay !== false; // default true

    // Build combined media array: { type: 'image'|'video', src: string }
    const imageItems = images.map(src => ({ type: 'image', src }));
    const videoItems = videos.map(src => ({ type: 'video', src }));
    const media = videoPosition === 'first'
        ? [...videoItems, ...imageItems]
        : [...imageItems, ...videoItems];

    const active = media[activeIndex] || media[0];

    // When switching to a video, autoplay if enabled
    useEffect(() => {
        if (active?.type === 'video' && videoRef.current) {
            videoRef.current.load();
            if (videoAutoplay) {
                videoRef.current.play().catch(() => { /* browser may block */ });
            }
        }
    }, [activeIndex, active?.type, videoAutoplay]);

    const goTo = (idx) => setActiveIndex(idx);
    const next = () => setActiveIndex((prev) => (prev + 1) % media.length);
    const prev = () => setActiveIndex((prev) => (prev - 1 + media.length) % media.length);

    return (
        <div className={styles.galleryContainer}>
            {/* ── Main View ── */}
            <div className={styles.mainImageWrap}>

                {active?.type === 'video' ? (
                    <video
                        ref={videoRef}
                        key={active.src}
                        className={styles.mainVideo}
                        src={active.src}
                        muted
                        loop
                        playsInline
                        controls
                        autoPlay={videoAutoplay}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <Image
                        src={active?.src || '/placeholder.jpg'}
                        alt={`${product.name} — view ${activeIndex + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className={styles.mainImage}
                        priority
                    />
                )}

                {/* Nav arrows (only when >1 media item) */}
                {media.length > 1 && (
                    <>
                        <button
                            className={`${styles.navBtn} ${styles.prevBtn}`}
                            onClick={(e) => { e.stopPropagation(); prev(); }}
                            aria-label="Previous"
                        >
                            &#10094;
                        </button>
                        <button
                            className={`${styles.navBtn} ${styles.nextBtn}`}
                            onClick={(e) => { e.stopPropagation(); next(); }}
                            aria-label="Next"
                        >
                            &#10095;
                        </button>
                    </>
                )}

                {/* Counter */}
                {media.length > 1 && (
                    <span className={styles.imageCounter}>
                        {activeIndex + 1} / {media.length}
                        {active?.type === 'video' && <span className={styles.videoLabel}> · Video</span>}
                    </span>
                )}
            </div>

            {/* ── Thumbnail Strip ── */}
            {media.length > 1 && (
                <div className={styles.thumbnails}>
                    {media.map((item, idx) => (
                        <div
                            key={idx}
                            className={`${styles.thumbnail} ${idx === activeIndex ? styles.activeThumb : ''}`}
                            onClick={() => goTo(idx)}
                        >
                            {item.type === 'video' ? (
                                <div className={styles.videoThumb}>
                                    {getVideoPoster(item.src) ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={getVideoPoster(item.src)}
                                            alt="Video"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className={styles.videoThumbPlaceholder} />
                                    )}
                                    {/* Play icon overlay */}
                                    <div className={styles.playOverlay}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>
                            ) : (
                                <Image
                                    src={item.src}
                                    alt={`Thumbnail ${idx + 1}`}
                                    fill
                                    sizes="68px"
                                    style={{ objectFit: 'cover' }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
