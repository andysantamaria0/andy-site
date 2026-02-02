import './globals.css';

export const metadata = {
  title: 'Andy Santamaria',
  description: 'Startup Co-Founder, Reading, Writing, Some Backgammon. Based in NYC.',
  openGraph: {
    title: 'Andy Santamaria',
    description: 'Startup Co-Founder, Reading, Writing, Some Backgammon. Based in NYC.',
    url: 'https://andysantamaria.com',
    siteName: 'Andy Santamaria',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Andy Santamaria',
    description: 'Startup Co-Founder, Reading, Writing, Some Backgammon. Based in NYC.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Karla:ital,wght@0,400;0,500;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
