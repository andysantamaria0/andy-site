import './globals.css';

const TITLE = 'Andy Santamaria — Product Leader & AI Engineer';
const DESCRIPTION =
  'Product leader and AI engineer in New York. Twelve years at early-stage startups, from Square to the frontier of AI engineering.';

export const viewport = {
  themeColor: '#0A1628',
};

export const metadata = {
  metadataBase: new URL('https://andysantamaria.com'),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://andysantamaria.com',
    siteName: 'Andy Santamaria',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,700&family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400&family=Special+Elite&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
