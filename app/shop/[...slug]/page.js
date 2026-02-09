import { db } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Navbar from '@/components/Navbar';
import styles from '@/app/page.module.css';
import Link from 'next/link';

export default async function CategoryPage({ params }) {
    // Await params for Next.js 15+ compatibility (just in case, safe pattern)
    const resolvedParams = await params;
    const slugArray = resolvedParams.slug;
    const currentSlug = slugArray[slugArray.length - 1];

    // Fetch Data
    const category = await db.getCategoryBySlug(currentSlug);
    const categoryTree = await db.getCategoryTree(); // For Navbar

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

    return (
        <main className={styles.main}>
            <Navbar categories={categoryTree} />

            {/* Hero / Header */}
            <section className={styles.hero} style={{ minHeight: '40vh' }}>
                <div className="container">
                    <div style={{ fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7 }}>
                        {/* Breadcrumbs could go here */}
                        {category.type} Collection
                    </div>
                    <h1 className={styles.heroTitle}>
                        {category.name} <br className={styles.mobileBreak} />
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
                        <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '0.5rem', marginBottom: '1.5rem', fontWeight: 300, fontSize: '1.2rem', textTransform: 'uppercase' }}>
                            Explore {category.name}
                        </h3>
                        <div className={styles.grid}>
                            {category.children.map(child => (
                                <Link href={`/shop/${slugArray.join('/')}/${child.slug}`} key={child._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', transition: 'transform 0.2s' }}>
                                        <div style={{ aspectRatio: '1/1', background: '#f9f9f9', position: 'relative' }}>
                                            {child.image ? (
                                                <img src={child.image} alt={child.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc' }}>No Image</div>
                                            )}
                                        </div>
                                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{child.name}</h4>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* PRODUCTS GRID */}
                <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '0.5rem', marginBottom: '1.5rem', fontWeight: 300, fontSize: '1.2rem', textTransform: 'uppercase' }}>
                    {products.length} Designs
                </h3>

                {products.length > 0 ? (
                    <div className={styles.grid}>
                        {products.map((product, index) => (
                            <div key={product._id} className="fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                                <ProductCard product={product} categoryType={category.type} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#888', fontStyle: 'italic' }}>
                        No designs listed in this section yet.
                    </div>
                )}
            </section>

            <footer className={styles.footer}>
                <p>&copy; 2024 LUXE. Digital Atelier.</p>
            </footer>
        </main>
    );
}
