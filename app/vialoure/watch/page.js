import './watch.css';

const description = 'A 60-second look at Vialoure: shared itineraries, an AI concierge, expenses, and a travel journal.';

export const metadata = {
  title: 'Watch Vialoure — 60-second walkthrough',
  description,
  openGraph: {
    title: 'Vialoure — The trip, all together',
    description,
    url: 'https://andysantamaria.com/vialoure/watch',
    images: [{ url: '/videos/vialoure-tour-poster.jpg', width: 1920, height: 1080, alt: 'Vialoure — Less coordinating. More being there.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vialoure — 60-second walkthrough',
    description,
    images: ['/videos/vialoure-tour-poster.jpg'],
  },
};

export default function WatchVialoure() {
  return (
    <main className="v-watch">
      <div className="v-watch-inner">
        <a className="v-watch-back" href="/">&larr; Andy Santamaria</a>
        <header>
          <p className="v-watch-eyebrow">Vialoure · 60-second walkthrough</p>
          <h1>The trip, all together.</h1>
          <p className="v-watch-intro">A private concierge for traveling with friends.</p>
        </header>
        <figure>
          <video
            className="v-watch-player"
            controls
            playsInline
            preload="none"
            poster="/videos/vialoure-tour-poster.jpg"
            width="1920"
            height="1080"
            aria-label="Vialoure 60-second product walkthrough"
            aria-describedby="v-watch-caption"
          >
            <source src="/videos/vialoure-tour-60s.mp4" type="video/mp4" />
            <a href="/videos/vialoure-tour-60s.mp4">Download the walkthrough</a>
          </video>
          <figcaption id="v-watch-caption">Silent, with on-screen captions. Fictional trip and sample concierge conversation.</figcaption>
        </figure>
        <p className="v-watch-summary">Explore a shared trip, browse the calendar, ask the concierge a question, settle expenses, and revisit the travel journal.</p>
        <a className="v-watch-more" href="/vialoure">Explore Vialoure <span aria-hidden="true">&rarr;</span></a>
      </div>
    </main>
  );
}
