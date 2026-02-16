import SystemDesignContent from './SystemDesignContent';

export const metadata = {
  title: 'Vialoure — System Architecture',
  description: 'Full system architecture for Vialoure. Every service, how they connect, why they were chosen, and the tradeoffs.',
  openGraph: {
    title: 'Vialoure — System Architecture',
    description: 'Full system architecture for Vialoure. Every service, how they connect, why they were chosen, and the tradeoffs.',
    url: 'https://andysantamaria.com/system-design',
    siteName: 'Andy Santamaria',
    type: 'website',
  },
};

export default function SystemDesignPage() {
  return <SystemDesignContent />;
}
