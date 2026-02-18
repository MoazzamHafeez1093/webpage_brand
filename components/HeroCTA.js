'use client';

import styles from '../app/page.module.css';

export default function HeroCTA() {
    return (
        <a
            href="https://wa.me/923211234567?text=Hi%2C%20I%20have%20a%20design%20in%20mind.%20Sending%20photo%20now..."
            target="_blank"
            className={styles.ctaButton}
            style={{ marginTop: '2.5rem' }}
        >
            Have a design in mind? Send it to us for a quote.
        </a>
    );
}
