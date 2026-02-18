import { db } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Navbar from '@/components/Navbar';
import HeroCTA from '@/components/HeroCTA';
import Link from 'next/link';
import styles from './page.module.css';

// Server Component
export default async function Home() {
  const categories = await db.getCategoryTree();
  const collectionsWithProducts = await db.getCollectionsWithProducts();

  return (
    <main className={styles.main}>
      {/* Sticky Header */}
      <Navbar categories={categories} />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>
            House of <br className={styles.mobileBreak} />
            <span className={styles.italic}>Aslam</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Explore our curated collections. <br />
            Touch to discover the finest details.
          </p>
          <HeroCTA />
        </div>
      </section>

      {/* Collections — Vertical Browse, Products Scroll Horizontally */}
      <section className={styles.collectionsSection}>
        {collectionsWithProducts.length > 0 ? (
          collectionsWithProducts.map((collection) => (
            <div
              key={collection._id}
              id={`collection-${collection.slug}`}
              className={styles.collectionBlock}
            >
              {/* Collection Header */}
              <div className={styles.collectionHeader}>
                <div className={styles.collectionInfo}>
                  <Link href={`/shop/${collection.slug}`} className={styles.collectionLink}>
                    <h2 className={styles.collectionName}>{collection.name}</h2>
                  </Link>
                  {collection.description && (
                    <p className={styles.collectionDescription}>{collection.description}</p>
                  )}
                  <div className={styles.collectionMeta}>
                    <span className={styles.collectionCount}>
                      {collection.products.length} {collection.products.length === 1 ? 'piece' : 'pieces'}
                    </span>
                    <Link href={`/shop/${collection.slug}`} className={styles.viewAllLink}>
                      View Collection &#8594;
                    </Link>
                  </div>
                </div>
                {collection.coverImage && (
                  <Link href={`/shop/${collection.slug}`} className={styles.collectionCover}>
                    <img
                      src={collection.coverImage}
                      alt={collection.name}
                      loading="lazy"
                    />
                  </Link>
                )}
              </div>

              {/* Horizontal Product Scroll */}
              {collection.products.length > 0 ? (
                <div className={styles.productScroll} style={{ marginLeft: '3rem', marginRight: '3rem' }}>
                  {collection.products.map((product) => (
                    <div key={product._id} className={styles.productScrollItem}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyCollection}>Coming soon</p>
              )}
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
            No collections found. Add collections from the admin panel.
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
          href="https://wa.me/923211234567?text=Hi%2C%20I%20have%20a%20custom%20design%20request.%20I%27d%20like%20to%20send%20a%20photo%20for%20a%20quote."
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
