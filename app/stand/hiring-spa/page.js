import Link from 'next/link';
import NotchReveal from '../../../components/NotchReveal';

export const metadata = {
  title: 'The Hiring Spa — Andy Santamaria',
  description: 'An AI-powered job matching portal for engineers. Personalized, transparent matches scored across five dimensions.',
};

export default function HiringSpaDetail() {
  return (
    <div className="stand">
      <div className="stand-container">
        <Link href="/stand" className="stand-detail-back">
          <span className="stand-detail-back-arrow">←</span> Back
        </Link>

        <header className="stand-header">
          <h1 className="stand-name">The Hiring Spa</h1>
          <p className="stand-title">AI-Powered Job Matching for Engineers</p>
          <div className="stand-rule" />
        </header>

        <div className="stand-detail-section">
          <p>
            I built an AI-powered job matching portal for engineers. Engineers complete a short onboarding flow and receive personalized, transparent job matches scored across five dimensions by Claude AI.
          </p>
          <img className="stand-screenshot" src="/stand/hiring-spa-matches.jpg" alt="Hiring Spa match card — 80% match with dimension scores" style={{ marginTop: 16, marginBottom: 16 }} />
        </div>

        <NotchReveal compact />

        <div className="stand-detail-section">
          <h2>How It Works</h2>

          <h3>Magic Link Authentication</h3>
          <ul>
            <li>Passwordless email-only login via Supabase OTP</li>
            <li>PKCE flow for cross-subdomain session handling</li>
            <li>Intent tracking to survive browser switches during login</li>
          </ul>

          <h3>Onboarding</h3>
          <ul>
            <li>Engineer provides GitHub URL, LinkedIn URL, portfolio URL, and resume</li>
            <li>I have it automatically crawl GitHub repos (languages, stars, contributions) and portfolio content in the background</li>
            <li>Claude synthesizes findings into an <strong>Engineer DNA</strong> profile — top skills, seniority signals, project highlights</li>
          </ul>

          <h3>Questionnaire (~5 minutes)</h3>
          <ul>
            <li>Five sections: work preferences, career growth goals, strengths, growth areas, deal breakers</li>
            <li>Priority sliders (1–5): work-life balance, culture, mission-driven, technical challenges</li>
            <li>Location preferences (NYC / SF / Remote + custom)</li>
          </ul>

          <h3>Matches Dashboard</h3>
          <ul>
            <li>Top 10 personalized job matches, each scored 0–100 across five dimensions: <strong>Mission, Technical, Culture, Environment, DNA</strong></li>
            <li>Scores weighted by the engineer&apos;s priority ratings</li>
            <li>Transparent reasoning and a highlight quote per match</li>
            <li>Feedback buttons: &ldquo;I Applied&rdquo; / &ldquo;Not a Fit&rdquo; (with categorized reasons)</li>
            <li>One-click exclusion rules (locations, companies, keywords)</li>
            <li>Weekly application counter</li>
          </ul>
        </div>

        <NotchReveal compact />

        <div className="stand-detail-section">
          <h2>Matching Safeguards</h2>
          <ul>
            <li>Minimum score of 40 on every dimension to surface a match</li>
            <li>If Technical score &lt; 50, overall score is capped at 50%</li>
            <li>Maximum 2 jobs per company to avoid saturation</li>
            <li>Recency boost for fresh postings (0–5 points, tapers over 14 days)</li>
            <li>Staleness penalty for matches shown 2+ weeks without feedback</li>
            <li>Sparse questionnaire detection: if &lt;3 of 5 sections filled, Claude scores 50 (neutral) on missing dimensions</li>
          </ul>
        </div>

        <NotchReveal compact />

        <div className="stand-detail-section">
          <h2>Technical Details</h2>

          <h3>Stack</h3>
          <div className="stand-detail-stack">
            <span className="stand-detail-stack-item">Next.js 15</span>
            <span className="stand-detail-stack-item">React 19</span>
            <span className="stand-detail-stack-item">TypeScript</span>
            <span className="stand-detail-stack-item">Supabase</span>
            <span className="stand-detail-stack-item">Claude Sonnet</span>
            <span className="stand-detail-stack-item">Framer Motion</span>
            <span className="stand-detail-stack-item">PostHog</span>
            <span className="stand-detail-stack-item">Resend</span>
            <span className="stand-detail-stack-item">Discord Webhooks</span>
          </div>

          <h3>Matching Algorithm</h3>
          <p>
            I wrote the matching pipeline in approximately 1,025 lines. It runs in three stages:
          </p>
          <div className="stand-detail-flow">
            {`1. Rule-based pre-filter — extract keywords from engineer profile, score each job 0–100 by keyword overlap, select top 30 candidates
2. AI detailed scoring — for each candidate job, Claude scores five dimensions (0–100) with reasoning, using engineer DNA, questionnaire answers, and priority ratings
3. Filtering & ranking — apply minimum thresholds, recency boost, staleness penalty, technical floor cap, weighted average, max 2 per company, return top 10`}
          </div>

          <h3>Profile Crawl Pipeline</h3>
          <ul>
            <li>Runs asynchronously after signup</li>
            <li>Calls GitHub API for repos, languages, contribution data</li>
            <li>Scrapes portfolio URL with Cheerio</li>
            <li>Claude synthesizes into structured Engineer DNA</li>
            <li>Status progression: <span className="stand-detail-code">draft → crawling → questionnaire → complete</span></li>
          </ul>

          <h3>Deployment</h3>
          <ul>
            <li>Vercel (Next.js hosting)</li>
            <li>Supabase Cloud (database + auth)</li>
            <li>Cron job runs Monday 5 PM UTC for weekly match recomputation</li>
          </ul>
        </div>

        <img className="stand-screenshot" src="/stand/hiring-spa-feedback.jpg" alt="Discord user feedback — engineer recommending The Hiring Spa" style={{ marginTop: 0 }} />

        <footer className="stand-footer">
          <svg viewBox="0 0 120 48" width="16" height="7" className="stand-footer-mark" aria-hidden="true">
            <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
          </svg>
        </footer>
      </div>
    </div>
  );
}
