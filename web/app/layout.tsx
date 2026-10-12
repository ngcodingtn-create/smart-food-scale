import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Mono, Instrument_Sans } from 'next/font/google';
import './globals.css';
import { Breadcrumb } from '@/components/Breadcrumb';
import { InlineScript } from '@/components/InlineScript';
import { PageNav } from '@/components/PageNav';
import { MobileBar, Sidebar } from '@/components/Sidebar';
import { Toc } from '@/components/Toc';
import { REPO_URL } from '@/lib/nav';

// Three faces, two voices (see the token notes in globals.css). next/font
// downloads them at build time and serves them from this origin, so a reader's
// browser never contacts Google.
const display = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-display-face',
});
const body = Instrument_Sans({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-body',
});
const label = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-label',
});

export const metadata: Metadata = {
  title: {
    default: 'Smart Food Scale',
    template: '%s · Smart Food Scale',
  },
  description:
    'An IoT kitchen scale that weighs a meal and returns its calories and macros. ' +
    'The camera answers what the food is; the load cell answers how much of it there is.',
};

// Runs while the HTML is being parsed, so a dark-theme reader never sees a
// white flash. It has to be an inline script in <head> for that — see
// components/InlineScript.tsx for why next/script is not enough.
// Precedence: ?theme= in the URL (shareable, and how screenshots are taken),
// then the reader's saved choice, then the OS preference. `initialDark()` in
// components/ThemeToggle.tsx mirrors this logic; change the two together.
const THEME_BOOT = `
try {
  var forced = new URLSearchParams(location.search).get('theme');
  var stored = localStorage.getItem('theme');
  var dark = forced ? forced === 'dark'
    : stored ? stored === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', dark);
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${label.variable}`}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={THEME_BOOT} />
      </head>
      <body>
        <a href="#content" className="skip-link">
          Skip to content
        </a>

        <div className="shell">
          <Sidebar />

          <div className="shell-main">
            <MobileBar />

            {/* One column, or article + outline on wide screens. The footer is
                a third grid child and lands under the article. */}
            <div className="page">
              <main id="content" tabIndex={-1} className="min-w-0 outline-none">
                <Breadcrumb />
                <article className="prose">{children}</article>
                <PageNav />
              </main>

              <Toc />

              <footer className="site-foot">
                <span>
                  University IoT team project · the camera answers <em>what</em>, the load cell
                  answers <em>how much</em>
                </span>
                <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
                  Source on GitHub
                </a>
              </footer>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
