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
      <body>{children}</body>
    </html>
  );
}
