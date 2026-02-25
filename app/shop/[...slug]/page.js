import { db } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default async function CategoryPage({ params }) {
    const resolvedParams = await params;
    const slugArray = resolvedParams.slug;
    const currentSlug = slugArray[slugArray.length - 1];

    // Fetch Data in parallel
    const [category, categoryTree] = await Promise.all([
        db.getCategoryBySlug(currentSlug),
        db.getCategoryTree()
    ]);

    if (!category) {
        return (
            <main className={styles.page}>
                <Navbar categories={categoryTree} />
                <div className={styles.notFound}>
                    <h1 className={styles.notFoundTitle}>Collection Not Found</h1>
                    <p className={styles.notFoundText}>The collection you are looking for does not exist.</p>
                    <Link href="/" className={styles.notFoundLink}>Return Home</Link>
                </div>
            </main>
        );
    }

    const hasChildren = category.children && category.children.length > 0;

    // When parent has subcollections: show ONLY its own direct products
    // When leaf collection: show all products (including descendants)
    const products = hasChildren
        ? await db.getDirectProductsByCategory(category)
        : await db.getProductsByCategory(category);

    const categoryType = products.length > 0 ? products[0].businessType : null;

    // Enrich children with product counts (parallel fetch)
    let enrichedChildren = [];
    if (hasChildren) {
        enrichedChildren = await Promise.all(
            category.children.map(async (child) => {
                const count = await db.getProductCountByCategory(child._id);
                return { ...child, productCount: count };
            })
        );
    }

    return (
        <main className={styles.page}>
            <Navbar categories={categoryTree} />

            {/* Collection Hero */}
            <section className={styles.hero}>
                <div className={styles.heroInner}>
                    <div className={styles.breadcrumb}>
                        <Link href="/">Home</Link>
                        <span className={styles.breadcrumbSeparator}>/</span>
                        <span>{category.name}</span>
                    </div>
                    <h1 className={styles.heroTitle}>{category.name}</h1>
                    {category.description && (
                        <p className={styles.heroDescription}>{category.description}</p>
                    )}
                    <div className={styles.heroDivider} />
                </div>
            </section>

            {/* Subcollection Cards */}
            {hasChildren && enrichedChildren.length > 0 && (
                <section className={styles.subcollectionsSection}>
                    <h3 className={styles.sectionLabel}>
                        Explore {category.name}
                    </h3>
                    <div className={styles.subcollectionsGrid}>
                        {enrichedChildren.map(child => (
                            <Link
                                href={`/shop/${slugArray.join('/')}/${child.slug}`}
                                key={child._id}
                                className={styles.subcollectionCard}
                            >
                                <div className={styles.subcollectionImageWrap}>
                                    {child.coverImage ? (
                                        <Image
                                            src={child.coverImage}
                                            alt={child.name}
                                            fill
                                            sizes="(max-width: 600px) 100vw, 50vw"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className={styles.subcollectionPlaceholder}>
                                            {child.name}
                                        </div>
                                    )}
                                    <div className={styles.subcollectionOverlay}>
                                        <h4 className={styles.subcollectionName}>{child.name}</h4>
                                        <span className={styles.subcollectionCount}>
                                            {child.productCount} {child.productCount === 1 ? 'Design' : 'Designs'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Products Grid */}
            <section className={styles.productsSection}>
                <h3 className={styles.productCount}>
                    {hasChildren && products.length > 0
                        ? `${products.length} ${products.length === 1 ? 'Design' : 'Designs'} in ${category.name}`
                        : `${products.length} ${products.length === 1 ? 'Design' : 'Designs'}`
                    }
                </h3>

                {products.length > 0 ? (
                    <div className={styles.productGrid}>
                        {products.map((product, index) => (
                            <div
                                key={product._id}
                                className={styles.productItem}
                                style={{ animationDelay: `${index * 60}ms` }}
                            >
                                <ProductCard product={product} categoryType={categoryType} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        No designs listed in this collection yet.
                    </div>
                )}
            </section>

            {/* Custom Design CTA */}
            <section className={styles.ctaSection}>
                <h2 className={styles.ctaTitle}>Have a Design in Mind?</h2>
                <p className={styles.ctaText}>
                    Our atelier brings your vision to life. Share your inspiration or sketch,
                    and let us craft a masterpiece just for you.
                </p>
                <a
                    href="https://wa.me/923346202291?text=Hi%2C%20I%20have%20a%20custom%20design%20request.%20I%27d%20like%20to%20send%20a%20photo%20for%20a%20quote."
                    target="_blank"
                    className={styles.ctaButton}
                >
                    Get a Custom Quote
                </a>
            </section>

            <footer className={styles.footer}>
                <p>&copy; 2025 House of Aslam. All Rights Reserved.</p>
            </footer>
        </main>
    );
}
