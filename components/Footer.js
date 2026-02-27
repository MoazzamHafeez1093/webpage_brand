import styles from './Footer.module.css';
import Link from 'next/link';

export default function Footer() {
    const phoneNumber = '923346202291';
    const waUrl = `https://wa.me/${phoneNumber}`;
    const instagramUrl = 'https://www.instagram.com/houseoaslam';
    const shopAddress = '123 Main Boulevard, Gulberg III, Lahore, Pakistan';

    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                {/* Brand */}
                <div className={styles.brandCol}>
                    <h2 className={styles.brandName}>House of Aslam</h2>
                    <p className={styles.tagline}>Since 1998</p>
                    <div className={styles.goldLine} />
                    <p className={styles.brandDesc}>
                        Crafting elegance with tradition. Premium bespoke tailoring
                        for those who appreciate the art of fine clothing.
                    </p>
                </div>

                {/* Quick Links */}
                <div className={styles.col}>
                    <h4 className={styles.colTitle}>Explore</h4>
                    <nav className={styles.navLinks}>
                        <Link href="/">Home</Link>
                        <a href={waUrl} target="_blank" rel="noopener noreferrer">Contact Us</a>
                    </nav>
                </div>

                {/* Connect */}
                <div className={styles.col}>
                    <h4 className={styles.colTitle}>Connect</h4>
                    <nav className={styles.navLinks}>
                        <a href={waUrl} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                            <svg viewBox="0 0 32 32" className={styles.socialIcon}>
                                <path
                                    fill="currentColor"
                                    d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.9 15.9 0 0016.004 32C24.826 32 32 24.826 32 16.004S24.826 0 16.004 0zm9.332 22.608c-.39 1.098-1.932 2.01-3.15 2.276-.834.178-1.924.32-5.594-1.202-4.694-1.946-7.712-6.71-7.944-7.018-.226-.308-1.846-2.462-1.846-4.694 0-2.232 1.168-3.33 1.584-3.784.39-.426 1.024-.616 1.632-.616.198 0 .374.01.534.018.454.02.682.046.982.762.374.89 1.286 3.122 1.396 3.35.112.228.224.534.074.842-.14.316-.264.456-.492.716-.228.26-.444.458-.672.736-.21.244-.446.504-.19.988.256.478 1.138 1.876 2.444 3.04 1.68 1.496 3.094 1.96 3.534 2.178.34.168.746.138.99-.118.312-.328.698-.872 1.09-1.41.278-.384.63-.432.998-.282.374.144 2.368 1.118 2.774 1.322.406.204.678.308.778.474.098.166.098.962-.292 2.06z"
                                />
                            </svg>
                            <span>WhatsApp</span>
                        </a>
                        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                            <svg viewBox="0 0 24 24" className={styles.socialIcon}>
                                <path
                                    fill="currentColor"
                                    d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                                />
                            </svg>
                            <span>Instagram</span>
                        </a>
                    </nav>
                </div>

                {/* Address */}
                <div className={styles.col}>
                    <h4 className={styles.colTitle}>Visit Us</h4>
                    <address className={styles.address}>
                        <svg viewBox="0 0 24 24" className={styles.addressIcon}>
                            <path
                                fill="currentColor"
                                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"
                            />
                        </svg>
                        <span>{shopAddress}</span>
                    </address>
                </div>
            </div>

            {/* Bottom bar */}
            <div className={styles.bottom}>
                <div className={styles.bottomInner}>
                    <p>&copy; {new Date().getFullYear()} House of Aslam. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
