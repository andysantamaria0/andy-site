import './product.css';
import ProductContent from './ProductContent';

export const metadata = {
  title: 'Andy Santamaria — Product Engineering for Startups',
  description: 'Product leader and engineer with 12 years at early-stage startups. From Square to the frontier of AI engineering. Based in NYC.',
  openGraph: {
    title: 'Andy Santamaria — Product Engineering for Startups',
    description: 'Product leader and engineer with 12 years at early-stage startups. From Square to the frontier of AI engineering. Based in NYC.',
    url: 'https://andysantamaria.com/product',
    siteName: 'Andy Santamaria',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Andy Santamaria — Product Engineering for Startups',
    description: 'Product leader and engineer with 12 years at early-stage startups. From Square to the frontier of AI engineering. Based in NYC.',
  },
};

export default function ProductPage() {
  return <ProductContent />;
}
