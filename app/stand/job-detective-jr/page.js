import Link from 'next/link';
import NotchReveal from '../../../components/NotchReveal';

export const metadata = {
  title: 'Job Detective Jr. — Andy Santamaria',
  description: 'An automated job discovery system that scans companies for open engineering positions across 6+ ATS platforms.',
};

export default function JobDetectiveDetail() {
  return (
    <div className="stand">
      <div className="stand-container">
        <Link href="/stand" className="stand-detail-back">
          <span className="stand-detail-back-arrow">←</span> Back
        </Link>

        <header className="stand-header">
          <h1 className="stand-name">Job Detective Jr.</h1>
          <p className="stand-title">Automated Job Discovery &amp; Tracking</p>
          <div className="stand-rule" />
        </header>

        <div className="stand-detail-section">
          <p>
            I built an automated job discovery and tracking system that scans companies&apos; job boards for open software engineering positions. It fetches company data from HubSpot CRM, detects their ATS platform, scrapes matching jobs, and distributes results to Google Sheets, Discord, and the Fractal Portal.
          </p>
          <img className="stand-screenshot" src="/stand/job-detective-jr.png" alt="Job Detective Jr. Discord bot — scan results showing 1,192 companies scanned" style={{ marginTop: 16, marginBottom: 16 }} />
        </div>

        <NotchReveal compact />

        <div className="stand-detail-section">
          <h2>Features</h2>

          <h3>Multi-ATS Job Scanning</h3>
          <ul>
            <li><strong>Tier 1:</strong> Direct API integration with Greenhouse, Lever, Ashby, Workable, SmartRecruiters, and Recruitee</li>
            <li><strong>Tier 2:</strong> Careers page scraping with BeautifulSoup — tests <span className="stand-detail-code">/careers</span>, <span className="stand-detail-code">/jobs</span>, <span className="stand-detail-code">/careers/engineering</span>, <span className="stand-detail-code">/join</span>, <span className="stand-detail-code">/work-with-us</span></li>
            <li><strong>Tier 3:</strong> Claude web search as last resort</li>
            <li>Manual override system for companies with non-standard setups</li>
          </ul>

          <h3>Smart Job Matching</h3>
          <ul>
            <li>Regex-based filtering for SWE roles (frontend, backend, fullstack, DevOps, ML, data engineer, mobile, platform, infrastructure, SRE)</li>
            <li>Excludes senior/lead/principal/staff/director roles and non-engineering titles</li>
            <li><strong>Fractal Fit</strong> matcher: broader matching with NYC-only and years-of-experience filters (excludes roles requiring &gt;3 years)</li>
          </ul>

          <h3>External Board Scraping</h3>
          <ul>
            <li>Scrapes BuiltIn job board across 9 cities (NYC, SF, LA, Chicago, Boston, Seattle, Austin, Denver, Remote)</li>
            <li>Runs on Mondays via GitHub Actions</li>
          </ul>

          <h3>Google Sheets Output</h3>
          <ul>
            <li>Writes to 5 tabs: Active Jobs, Active Jobs in NYC, Active Remote Jobs, Companies Summary, Fractal Fit</li>
            <li>Deduplication keyed by (company domain, job URL) — preserves date added, updates last seen</li>
          </ul>

          <h3>Discord Notifications</h3>
          <ul>
            <li>Monday: scan summary with company count, jobs found, elapsed time</li>
            <li>Thursday: weekly digest of new jobs added in the past 7 days</li>
          </ul>

          <h3>Portal Integration</h3>
          <ul>
            <li>Pushes matched jobs to the Fractal Portal API via bearer token</li>
            <li>Deactivates stale jobs (14+ days not seen)</li>
            <li>Batch support up to 1,000 jobs</li>
          </ul>

          <h3>Email Intake System</h3>
          <ul>
            <li>FastAPI webhook server receiving forwarded emails</li>
            <li>Parses original sender from Gmail, Outlook, and Apple Mail formats</li>
            <li>Creates/finds HubSpot contacts and companies, creates notes with AI summaries</li>
            <li>HMAC-SHA256 signature verification</li>
          </ul>
        </div>

        <NotchReveal compact />

        <div className="stand-detail-section">
          <h2>Technical Details</h2>

          <h3>Stack</h3>
          <div className="stand-detail-stack">
            <span className="stand-detail-stack-item">Python 3.11+</span>
            <span className="stand-detail-stack-item">FastAPI</span>
            <span className="stand-detail-stack-item">Pydantic</span>
            <span className="stand-detail-stack-item">BeautifulSoup</span>
            <span className="stand-detail-stack-item">Claude Sonnet + Haiku</span>
            <span className="stand-detail-stack-item">Google Sheets API</span>
            <span className="stand-detail-stack-item">HubSpot API</span>
            <span className="stand-detail-stack-item">Discord Webhooks</span>
          </div>

          <h3>ATS Detection Cascade</h3>
          <div className="stand-detail-flow">
            {`1. Check manual overrides
2. Tier 1: Try ATS API endpoints with generated slugs from domain + company name
3. Tier 2: Scrape careers page paths, detect redirects to known ATS
4. Tier 3: Web search via Claude (if enabled)`}
          </div>

          <h3>Data Flow</h3>
          <div className="stand-detail-flow">
            {`HubSpot Companies → ATS Detection → Fetch Jobs → JobMatcher Filter
  → Google Sheets (5 tabs)
  → Discord (Monday summary + Thursday digest)
  → Fractal Portal API

BuiltIn Board → Scrape cities → JobMatcher Filter → Fractal Portal API

Forwarded Email → FastAPI /intake → Parse sender → HubSpot (contact + company + note)`}
          </div>

          <h3>Automated Scheduling</h3>
          <ul>
            <li><strong>Daily 8 AM UTC</strong> — Scan all HubSpot companies for jobs</li>
            <li><strong>Mondays 12 PM UTC</strong> — Scrape BuiltIn job board</li>
            <li><strong>Thursdays</strong> — Weekly Discord digest</li>
            <li><strong>On push/PR</strong> — Run test suite</li>
          </ul>

          <h3>Deployment</h3>
          <ul>
            <li>GitHub Actions for scheduled scanning</li>
            <li>Railway for email intake server</li>
            <li>Configurable rate limiting (default 2 req/s)</li>
          </ul>
        </div>

        <footer className="stand-footer">
          <svg viewBox="0 0 120 48" width="16" height="7" className="stand-footer-mark" aria-hidden="true">
            <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
          </svg>
        </footer>
      </div>
    </div>
  );
}
