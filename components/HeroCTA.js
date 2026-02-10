'use client';

export default function HeroCTA() {
    return (
        <a
            href="https://wa.me/923211234567?text=Hi%2C%20I%20have%20a%20design%20in%20mind.%20Sending%20photo%20now..."
            target="_blank"
            style={{
                display: 'inline-block',
                border: '1px solid #111',
                padding: '0.8rem 1.5rem',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#111',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                background: 'transparent',
                marginTop: '2rem'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#111'; }}
        >
            Have a design in mind? Send it to us for a quote.
        </a>
    );
}
