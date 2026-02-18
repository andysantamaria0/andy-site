import ProposalContent from './ProposalContent';

export const metadata = {
  title: 'Sprint Proposal — Stand × Andy Santamaria',
  description: 'A 2-week sprint to build Stand\'s production MVP. Scope, timeline, deliverables, and investment.',
  openGraph: {
    title: 'Sprint Proposal — Stand × Andy Santamaria',
    description: 'A 2-week sprint to build Stand\'s production MVP. Scope, timeline, deliverables, and investment.',
    url: 'https://andysantamaria.com/stand/proposal',
    siteName: 'Andy Santamaria',
    type: 'website',
  },
};

export default function ProposalPage() {
  return <ProposalContent />;
}
