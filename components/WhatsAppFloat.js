'use client';

import styles from './WhatsAppFloat.module.css';

export default function WhatsAppFloat() {
    const phoneNumber = '923346202291';
    const message = 'Hi! I would like to inquire about your products.';
    const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.floatBtn}
            aria-label="Chat on WhatsApp"
        >
            <svg viewBox="0 0 32 32" className={styles.icon}>
                <path
                    fill="white"
                    d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.9 15.9 0 0016.004 32C24.826 32 32 24.826 32 16.004S24.826 0 16.004 0zm9.332 22.608c-.39 1.098-1.932 2.01-3.15 2.276-.834.178-1.924.32-5.594-1.202-4.694-1.946-7.712-6.71-7.944-7.018-.226-.308-1.846-2.462-1.846-4.694 0-2.232 1.168-3.33 1.584-3.784.39-.426 1.024-.616 1.632-.616.198 0 .374.01.534.018.454.02.682.046 .982.762.374.89 1.286 3.122 1.396 3.35.112.228.224.534.074.842-.14.316-.264.456-.492.716-.228.26-.444.458-.672.736-.21.244-.446.504-.19.988.256.478 1.138 1.876 2.444 3.04 1.68 1.496 3.094 1.96 3.534 2.178.34.168.746.138.99-.118.312-.328.698-.872 1.09-1.41.278-.384.63-.432.998-.282.374.144 2.368 1.118 2.774 1.322.406.204.678.308.778.474.098.166.098.962-.292 2.06z"
                />
            </svg>
        </a>
    );
}
