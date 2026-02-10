import './globals.css';
import Script from 'next/script';
import { Playfair_Display, Montserrat } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const montserrat = Montserrat({
  weight: ['300', '400', '500'], // 300 IS CRITICAL for the "Thin/Modern" look
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'LUXE | Premium Apparel',
  description: 'Experience the finest fabrics in crystal clear detail.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${montserrat.variable}`}>
        {children}
        <Script
          src="https://upload-widget.cloudinary.com/global/all.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
