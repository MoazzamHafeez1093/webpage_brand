import { db } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

// Server Component
export default async function Home(props) {
  const searchParams = await props.searchParams;
  const category = searchParams?.category || 'All';
  const products = await db.getAllItems(category);

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
            {category === 'All' ? 'Timeless' : category} <br className={styles.mobileBreak} />
            <span className={styles.italic}>Collection</span>
          </h1>
          <p className={styles.heroSubtitle}>
            {products.length} items found. <br />
            Touch to explore the finest details.
          </p>
        </div>
      </section>

      {/* Product Grid */}
      <section className="container">
        {products.length > 0 ? (
          <div className={styles.grid}>
            {products.map((product, index) => (
              <div key={product._id} style={{ animationDelay: `${index * 100}ms` }} className="fade-in">
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

      <footer className={styles.footer}>
        <p>&copy; 2024 LUXE. Designed for Quality.</p>
      </footer>
    </main>
  );
}
