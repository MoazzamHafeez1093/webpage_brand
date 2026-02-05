import { db } from '@/lib/db';
import styles from './page.module.css';
import Link from 'next/link';

// Detailed Product View
export default async function ProductPage({ params }) {
    const product = await db.getItemById(params.id);

    if (!product) {
        return <div className="container">Product not found</div>;
    }

    return (
        <article className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backLink}>← Back to Collection</Link>
            </header>

            <div className={styles.grid}>
                {/* Large Zoomable Image */}
                <div className={styles.imageSection}>
                    {/* We can reuse the concepts from ProductCard but make it bigger */}
                    <InteractiveImage product={product} />
                </div>

                {/* Details */}
                <div className={styles.details}>
                    <span className={styles.category}>{product.category}</span>
                    <h1 className={styles.title}>{product.title}</h1>
                    <p className={styles.price}>${product.price.toFixed(2)}</p>

                    <div className={styles.sizes}>
                        <span className={styles.label}>Available Sizes:</span>
                        <div className={styles.sizeList}>
                            {product.sizes.map(size => (
                                <button key={size} className={styles.sizeBtn}>{size}</button>
                            ))}
                        </div>
                    </div>

                    <p className={styles.description}>{product.description}</p>

                    <button className={styles.cta}>Add to Bag</button>
                </div>
            </div>
        </article>
    );
}

// Client Component for Interaction isolated to this part
import InteractiveImage from './InteractiveImage';
