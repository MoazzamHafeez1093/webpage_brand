import { db } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Navbar from '@/components/Navbar';
import HeroCTA from '@/components/HeroCTA';
import styles from './page.module.css';

// Server Component
export default async function Home(props) {
  const searchParams = await props.searchParams;
  // Use 'collection' param instead of 'category', default to 'All'
  const collectionSlug = searchParams?.collection || 'All';
  const products = await db.getAllItems(collectionSlug);

  // Get category tree for the menu
  const categories = await db.getCategoryTree();

  return (
    <main className={styles.main}>
      {/* Sticky Header with Filter Logic */}
      <Navbar categories={categories} />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>
            {collectionSlug === 'All' ? 'Timeless' : collectionSlug.replace(/-/g, ' ')} <br className={styles.mobileBreak} />
            <span className={styles.italic}>Collection</span>
          </h1>
          <p className={styles.heroSubtitle}>
            {products.length} items found. <br />
            Touch to explore the finest details.
          </p>


          {/* NEW: Hero Design Upload CTA */}
          <HeroCTA />
        </div>
      </section>

      {/* Product Grid */}
      <section className="container">
        {products.length > 0 ? (
          <div className={styles.grid}>
            {products.map((product, index) => (
              <div key={product._id} style={{ animationDelay: `${index * 100}ms` }} className="fade-in masonry-item">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
            No items found in this collection.
          </div>
        )}
      </section>
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
            borderRadius: '4px',
            textDecoration: 'none',
            transition: 'all 0.3s ease'
          }}
        >
          Get a Custom Quote
        </a>
      </section>
      <footer className={styles.footer}>
        <p>&copy; 2024 LUXE. Designed for Quality.</p>
      </footer>
    </main >
  );
}
