import './globals.css';
import Script from 'next/script';
import { Playfair_Display, Montserrat } from 'next/font/google';
import WhatsAppFloat from '@/components/WhatsAppFloat';

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
  title: 'House of Aslam | Since 1998',
  description: 'Explore curated collections from House of Aslam. Premium apparel crafted with tradition and elegance.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${montserrat.variable}`}>
        {children}
        <WhatsAppFloat />
        <Script
          src="https://upload-widget.cloudinary.com/global/all.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
