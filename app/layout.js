import './globals.css';
import { Playfair_Display, Montserrat } from 'next/font/google';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import Footer from '@/components/Footer';

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
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}

