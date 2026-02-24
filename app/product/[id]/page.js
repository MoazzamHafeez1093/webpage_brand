import { db } from '@/lib/db';
import styles from './page.module.css';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import InteractiveImage from './InteractiveImage';
import ProductCard from '@/components/ProductCard';
import ProductActions from './ProductActions';

// Detailed Product View
export default async function ProductPage({ params }) {
    const resolvedParams = await params;
    const product = await db.getItemById(resolvedParams.id);
    const categories = await db.getCategoryTree();

    // Fetch related products from the same collection
    const collectionId = product?.collectionRef?._id || product?.collectionRef;
    const relatedProducts = collectionId
        ? await db.getRelatedProducts(collectionId, resolvedParams.id, 4)
        : [];

    if (!product) {
        return (
            <main className={styles.page}>
                <Navbar categories={categories} />
                <div className={styles.notFound}>
                    <p>Product not found.</p>
                    <Link href="/" style={{ color: 'var(--accent-gold)', marginTop: '1rem' }}>Return Home</Link>
                </div>
            </main>
        );
    }

    // Support both new and legacy schemas
    const title = product.name || product.title || 'Untitled';
    const category = product.collectionRef?.name || product.category || '';
    const collectionSlug = product.collectionRef?.slug || '';
    const isCustom = product.businessType === 'custom';
    const price = product.price;
    const sizes = product.availableSizes || product.sizes || [];
    const description = product.description || '';
    const tags = product.tags || [];
    const inStock = product.inStock !== false;
    const isFeatured = product.isFeatured || false;
    const customizationNotes = product.customizationNotes || '';

    // WhatsApp config
    const phoneNumber = '923346202291';
    const currentImgUrl = product.images?.[0] || '';

    return (
        <main className={styles.page}>
            <Navbar categories={categories} />

            <header className={styles.header}>
                <nav className={styles.breadcrumb}>
                    <Link href="/">Home</Link>
                    <span className={styles.breadcrumbSeparator}>/</span>
                    {collectionSlug ? (
                        <>
                            <Link href={`/shop/${collectionSlug}`}>{category}</Link>
                            <span className={styles.breadcrumbSeparator}>/</span>
                        </>
                    ) : category ? (
                        <>
                            <span>{category}</span>
                            <span className={styles.breadcrumbSeparator}>/</span>
                        </>
                    ) : null}
                    <span className={styles.breadcrumbCurrent}>{title}</span>
                </nav>
            </header>

            <div className={styles.productLayout}>
                {/* Image Gallery */}
                <div className={styles.galleryContainer}>
                    <InteractiveImage product={product} />
                </div>

                {/* Details */}
                <div className={styles.details}>
                    {/* Featured Badge */}
                    {isFeatured && (
                        <span className={styles.featuredBadge}>Featured</span>
                    )}

                    <span className={styles.category}>
                        {isCustom ? 'Custom Couture' : 'Retail Collection'} {category ? `\u2022 ${category}` : ''}
                    </span>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className={styles.tagsRow}>
                            {tags.map((tag, i) => (
                                <span key={i} className={styles.tag}>{tag}</span>
                            ))}
                        </div>
                    )}

                    <h1 className={styles.title}>
                        {title}
                        {/* Stock Badge (retail only) */}
                        {!isCustom && (
                            <span className={`${styles.stockBadge} ${inStock ? styles.inStock : styles.outOfStock}`}>
                                {inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                        )}
                    </h1>

                    {/* Show price for retail, hide for custom */}
                    {!isCustom && price != null && price > 0 && (
                        <p className={styles.price}>Rs. {typeof price === 'number' ? price.toLocaleString() : price}</p>
                    )}

                    {description && (
                        <>
                            <div className={styles.divider} />
                            <p className={styles.description}>{description}</p>
                        </>
                    )}

                    {/* Customization Notes (custom items) */}
                    {isCustom && customizationNotes && (
                        <div className={styles.customNotes}>
                            <p className={styles.customNotesLabel}>Customization Details</p>
                            <p className={styles.customNotesText}>{customizationNotes}</p>
                        </div>
                    )}

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

                    {/* Trust Note */}
                    <div className={styles.trustSection}>
                        <p className={styles.trustNote}>
                            Every piece is crafted with care and attention to detail.
                            We stand behind the quality of our work.
                        </p>
                        <div className={styles.promiseSection}>
                            <div className={styles.promiseItem}>
                                <div className={styles.promiseIcon}>◆</div>
                                <div className={styles.promiseText}>Premium Craftsmanship</div>
                            </div>
                            <div className={styles.promiseItem}>
                                <div className={styles.promiseIcon}>◆</div>
                                <div className={styles.promiseText}>Free Consultation</div>
                            </div>
                            <div className={styles.promiseItem}>
                                <div className={styles.promiseIcon}>◆</div>
                                <div className={styles.promiseText}>Made to Order</div>
                            </div>
                        </div>
                    </div>

                    {/* Size Selection + CTA (Client Component) */}
                    <ProductActions
                        sizes={sizes}
                        sizeOptions={product.sizeOptions || []}
                        isCustom={isCustom}
                        title={title}
                        category={category}
                        phoneNumber={phoneNumber}
                        currentImgUrl={currentImgUrl}
                        inStock={inStock}
                    />
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className={styles.relatedSection}>
                    <div className={styles.relatedInner}>
                        <h3 className={styles.relatedLabel}>You May Also Like</h3>
                        <div className={styles.relatedGrid}>
                            {relatedProducts.map((item, index) => (
                                <div
                                    key={item._id}
                                    className={styles.relatedItem}
                                    style={{ animationDelay: `${index * 80}ms` }}
                                >
                                    <ProductCard product={item} categoryType={item.businessType} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
}
