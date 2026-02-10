import { db } from '@/lib/db';
import styles from './page.module.css';
import Link from 'next/link';
import InteractiveImage from './InteractiveImage';

// Detailed Product View
export default async function ProductPage({ params }) {
    const resolvedParams = await params;
    const product = await db.getItemById(resolvedParams.id);

    if (!product) {
        return <div className="container" style={{ padding: '5rem', textAlign: 'center' }}>Product not found</div>;
    }

    // Support both new and legacy schemas
    const title = product.name || product.title || 'Untitled';
    const category = product.collectionRef?.name || product.category || '';
    const isCustom = product.businessType === 'custom';
    const price = product.price;
    const sizes = product.availableSizes || product.sizes || [];
    const description = product.description || '';

    // WhatsApp contextual message
    const phoneNumber = '923211234567';
    const currentImgUrl = product.images?.[0] || '';
    let waMessage = '';
    if (isCustom) {
        waMessage = `Hi, I'm interested in a price estimate for a design like "${title}".\nRef Image: ${currentImgUrl}`;
    } else {
        waMessage = `Hi, I would like to check size availability for "${title}" (${category}).\nRef Image: ${currentImgUrl}`;
    }
    const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(waMessage)}`;

    return (
        <article className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backLink}>&#8592; Back to Collection</Link>
            </header>

            <div className={styles.grid}>
                {/* Large Zoomable Image */}
                <div className={styles.imageSection}>
                    <InteractiveImage product={product} />
                </div>

                {/* Details */}
                <div className={styles.details}>
                    <span className={styles.category}>
                        {isCustom ? 'Custom Couture' : 'Retail Collection'} {category ? `\u2022 ${category}` : ''}
                    </span>
                    <h1 className={styles.title}>{title}</h1>

                    {/* Show price for retail, hide for custom */}
                    {!isCustom && price != null && price > 0 && (
                        <p className={styles.price}>${typeof price === 'number' ? price.toFixed(2) : price}</p>
                    )}

                    {/* Sizes (for retail products) */}
                    {!isCustom && sizes.length > 0 && (
                        <div className={styles.sizes}>
                            <span className={styles.label}>Available Sizes:</span>
                            <div className={styles.sizeList}>
                                {sizes.map(size => (
                                    <button key={size} className={styles.sizeBtn}>{size}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {description && <p className={styles.description}>{description}</p>}

                    {/* Inspiration vs Result comparison for custom items */}
                    {isCustom && product.inspirationImage && (
                        <div className={styles.comparisonSection}>
                            <span className={styles.label}>Inspiration vs Our Creation</span>
                            <div className={styles.comparisonGrid}>
                                <div className={styles.comparisonItem}>
                                    <img src={product.inspirationImage} alt="Client Inspiration" />
                                    <span className={styles.comparisonLabel}>Client&apos;s Vision</span>
                                </div>
                                <div className={styles.comparisonItem}>
                                    <img src={product.images?.[0] || '/placeholder.jpg'} alt="Our Creation" />
                                    <span className={styles.comparisonLabel}>Our Creation</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* WhatsApp CTA - Contextual */}
                    <a
                        href={waUrl}
                        target="_blank"
                        className={styles.cta}
                    >
                        {isCustom ? 'Get a Price Estimate' : 'Check Size Availability'}
                    </a>
                </div>
            </div>
        </article>
    );
}
