import Link from 'next/link';
import NotchReveal from '../../../components/NotchReveal';

export const metadata = {
  title: 'Fractal Admin Portal — Andy Santamaria',
  description: 'A management dashboard for Fractal Tech operations — companies, engineers, project cycles, content, and the hiring pipeline.',
};

export default function AdminPortalDetail() {
  return (
    <div className="stand">
      <div className="stand-container">
        <Link href="/stand" className="stand-detail-back">
          <span className="stand-detail-back-arrow">←</span> Back
        </Link>

        <header className="stand-header">
          <h1 className="stand-name">Fractal Admin Portal</h1>
          <p className="stand-title">Operations Dashboard</p>
          <div className="stand-rule" />
        </header>

        <div className="stand-detail-section">
          <p>
            I built a management dashboard for Fractal Tech&apos;s accelerator operations. It gives full visibility and control over companies, engineers, project cycles, content, and the hiring pipeline.
          </p>
          <img className="stand-screenshot" src="/stand/fractal-admin.png" alt="Fractal Admin — Engineer Pipeline dashboard" style={{ marginTop: 16, marginBottom: 16 }} />
        </div>

        <NotchReveal compact />

        <div className="stand-detail-section">
          <h2>Features</h2>

          <h3>Cycles Management</h3>
          <ul>
            <li>Manages feature submissions from companies through a lifecycle: <span className="stand-detail-code">Submitted → Reviewing → Posted → Matched → In Progress → Completed</span></li>
            <li>Tracks sprint dates, hours budgets, engineer assignments</li>
            <li>Filters by status, overdue submissions, unassigned, company hiring status</li>
            <li>Admin notes and submission history with full audit trail</li>
          </ul>

          <h3>Companies Directory</h3>
          <ul>
            <li>Company CRUD with search/filter by funding stage (Bootstrapped, Angel, Pre-Seed, Seed, Series A+)</li>
            <li>Contact emails, LinkedIn profiles, newsletter opt-in status</li>
            <li>HubSpot integration: contacts linked by email domain</li>
            <li>Bulk import capability</li>
          </ul>

          <h3>Engineers Management</h3>
          <ul>
            <li>Engineer directory with search, cohort filtering, focus area filtering</li>
            <li>Toggle &ldquo;available for cycles&rdquo; status</li>
            <li>Bulk import from CSV/JSON</li>
            <li>AMA (Ask Me Anything) submissions panel with tagging preferences</li>
            <li>Interest tracking: how many companies are interested in each engineer</li>
          </ul>

          <h3>Content Management</h3>
          <ul>
            <li>Highlights tab: weekly cohort highlights (title, description, week number)</li>
            <li>Spotlight tab: CMS for showcasing content (video, embed, text, image types)</li>
            <li>Display order control and active/inactive toggling</li>
          </ul>

          <h3>Hiring SPA Dashboard</h3>
          <ul>
            <li>Funnel visualization: Signed Up → Questionnaire → Got Matches → Applied (with conversion rates)</li>
            <li>Real-time activity feed (signups, questionnaires, matches, applications, dismissals)</li>
            <li>Engineers table with stage tracking, days in stage, match/applied/pending counts, average scores</li>
            <li>Per-engineer match detail view with expandable Claude reasoning</li>
            <li>Manual compute/recompute matches on demand</li>
          </ul>

          <h3>Ad-Hoc Matching</h3>
          <ul>
            <li>Paste a JD URL to instantly match against all engineers</li>
            <li>Extracts job details from Greenhouse, Lever, and Ashby ATS platforms</li>
            <li>Shows scored results per engineer</li>
            <li>Stores matches in database for review</li>
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
            <span className="stand-detail-stack-item">HubSpot API</span>
            <span className="stand-detail-stack-item">Claude AI</span>
            <span className="stand-detail-stack-item">PostHog</span>
            <span className="stand-detail-stack-item">Resend</span>
          </div>

          <h3>Auth &amp; Authorization</h3>
          <ul>
            <li>Admin check: <span className="stand-detail-code">profiles.is_admin === true</span> validated server-side</li>
            <li>RLS policies enforce admin-only access to all management tables</li>
            <li>API wrapper provides admin verification + service client + error handling</li>
          </ul>

          <h3>Routing &amp; Subdomain Logic</h3>
          <ul>
            <li>Engineer subdomain is hard-guarded — never shows company or admin pages</li>
            <li>Unauthenticated admin requests redirect to login</li>
            <li>Non-admin authenticated users redirect to dashboard</li>
          </ul>

          <h3>How the Three Systems Connect</h3>
          <div className="stand-detail-flow">
            {`Job-Jr scans HubSpot companies, detects ATS platforms, fetches & filters SWE jobs
  → Pushes jobs to Admin Portal via /api/jobs/ingest → scanned_jobs table

Admin Portal monitors hiring pipeline, views funnel metrics, runs ad-hoc JD matching
  → Match computation writes to engineer_job_matches table

Engineer SPA lets engineers sign up, complete questionnaire, get AI-scored matches
  → Feedback flows back to Admin for review`}
          </div>

          <h3>Scale</h3>
          <ul>
            <li>34+ database migrations</li>
            <li>36+ admin API routes</li>
            <li>RESTful CRUD for companies, engineers, cycles, highlights, spotlights</li>
          </ul>

          <h3>Deployment</h3>
          <ul>
            <li>Vercel for Next.js hosting (admin and engineer portals)</li>
            <li>Supabase Cloud for PostgreSQL + Auth</li>
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
