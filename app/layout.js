import './globals.css';
import Script from 'next/script';
import { Work_Sans, Lato } from 'next/font/google';

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const lato = Lato({
  weight: ['300', '400', '700'],
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
      <body className={`${workSans.variable} ${lato.variable}`}>
        {children}
        <Script
          src="https://upload-widget.cloudinary.com/global/all.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
