import { db } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Navbar from '@/components/Navbar';
import styles from '@/app/page.module.css';
import Link from 'next/link';

export default async function CategoryPage({ params }) {
    const resolvedParams = await params;
    const slugArray = resolvedParams.slug;
    const currentSlug = slugArray[slugArray.length - 1];

    // Fetch Data using Collection model
    const category = await db.getCategoryBySlug(currentSlug);
    const categoryTree = await db.getCategoryTree();

    if (!category) {
        return (
            <main className={styles.main}>
                <Navbar categories={categoryTree} />
                <div style={{ textAlign: 'center', padding: '5rem' }}>
                    <h1>Collection Not Found</h1>
                    <p>The section you are looking for does not exist.</p>
                    <Link href="/" style={{ textDecoration: 'underline' }}>Return Home</Link>
                </div>
            </main>
        );
    }

    const products = await db.getProductsByCategory(category);

    // Determine business type from products
    const categoryType = products.length > 0 ? products[0].businessType : null;

    return (
        <main className={styles.main}>
            <Navbar categories={categoryTree} />

            {/* Hero / Header */}
            <section className={styles.hero} style={{ minHeight: '40vh' }}>
                <div className="container">
                    <h1 className={styles.heroTitle}>
                        {category.name}
                    </h1>
                    {category.description && (
                        <p className={styles.heroSubtitle} style={{ maxWidth: '600px', margin: '1rem auto' }}>
                            {category.description}
                        </p>
                    )}
                </div>
            </section>

            <section className="container" style={{ paddingBottom: '4rem' }}>
                {/* SUBCATEGORIES GRID */}
                {category.children && category.children.length > 0 && (
                    <div style={{ marginBottom: '4rem' }}>
                        <h3 style={{
                            borderBottom: '1px solid #ddd',
                            paddingBottom: '0.5rem',
                            marginBottom: '1.5rem',
                            fontWeight: 300,
                            fontSize: '1.2rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}>
                            Explore {category.name}
                        </h3>
                        <div className={styles.grid}>
                            {category.children.map(child => (
                                <Link href={`/shop/${slugArray.join('/')}/${child.slug}`} key={child._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{
                                        overflow: 'hidden',
                                        transition: 'transform 0.3s ease',
                                        background: '#fafafa'
                                    }}>
                                        <div style={{ aspectRatio: '3/4', position: 'relative', overflow: 'hidden' }}>
                                            {child.coverImage ? (
                                                <img
                                                    src={child.coverImage}
                                                    alt={child.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        transition: 'transform 1.2s cubic-bezier(0.19, 1, 0.22, 1)'
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    height: '100%',
                                                    color: '#ccc',
                                                    fontSize: '0.9rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.1em'
                                                }}>
                                                    {child.name}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: '1rem 0', textAlign: 'left' }}>
                                            <h4 style={{
                                                margin: 0,
                                                fontSize: '1rem',
                                                fontFamily: 'var(--font-heading)',
                                                fontWeight: 400,
                                                letterSpacing: '0.02em'
                                            }}>{child.name}</h4>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* PRODUCTS GRID */}
                <h3 style={{
                    borderBottom: '1px solid #ddd',
                    paddingBottom: '0.5rem',
                    marginBottom: '1.5rem',
                    fontWeight: 300,
                    fontSize: '1.2rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                }}>
                    {products.length} Designs
                </h3>

                {products.length > 0 ? (
                    <div className={styles.grid}>
                        {products.map((product, index) => (
                            <div key={product._id} className="fade-in masonry-item" style={{ animationDelay: `${index * 50}ms` }}>
                                <ProductCard product={product} categoryType={categoryType} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#888', fontStyle: 'italic' }}>
                        No designs listed in this section yet.
                    </div>
                )}
            </section>

            {/* Custom Design CTA */}
            <section className="container" style={{ textAlign: 'center', padding: '6rem 1rem', background: '#fafafa', marginTop: '4rem' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '1rem', color: '#333' }}>
                    Have a Design in Mind?
                </h2>
                <p style={{ maxWidth: '600px', margin: '0 auto 2rem', color: '#666', lineHeight: 1.6 }}>
                    Our atelier brings your vision to life. Share your inspiration or sketch, and let us craft a masterpiece just for you.
                </p>
                <a
                    href="https://wa.me/923211234567?text=Hi%2C%20I%20have%20a%20custom%20design%20request.%20I%27d%20like%20to%20send%20a%20photo%20for%20a%20quote."
                    target="_blank"
                    style={{
                        display: 'inline-block',
                        background: '#000',
                        color: '#b08d55',
                        padding: '1rem 2.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        fontSize: '0.9rem',
                        border: '1px solid #000',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease'
                    }}
                >
                    Get a Custom Quote
                </a>
            </section>

            <footer className={styles.footer}>
                <p>&copy; 2025 LUXE. Digital Atelier.</p>
            </footer>
        </main>
    );
}
