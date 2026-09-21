import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import './globals.css';
import { MobileNav, Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PageNav } from '@/components/PageNav';
import { REPO_URL } from '@/lib/nav';

export const metadata: Metadata = {
  title: {
    default: 'Smart Food Scale',
    template: '%s · Smart Food Scale',
  },
  description:
    'An IoT kitchen scale that weighs a meal and returns its calories and macros. ' +
    'The camera answers what the food is; the load cell answers how much of it there is.',
};

// Runs before hydration so a dark-theme reader never sees a white flash.
// Delivered via next/script with strategy="beforeInteractive": a bare <script>
// tag rendered as a React child makes React 19 warn that it will never execute
// on the client.
// Precedence: ?theme= in the URL (shareable, and how screenshots are taken),
// then the reader's saved choice, then the OS preference.
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
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script
          id="theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_BOOT }}
        />
        <header className="sticky top-0 z-50 h-16 border-b border-[var(--rule)] bg-[var(--paper)]/85 backdrop-blur">
          <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
              <span
                aria-hidden="true"
                className="grid h-7 w-7 place-items-center rounded-md bg-[var(--accent)] text-sm text-white"
              >
                ⚖
              </span>
              <span className="text-[var(--ink)]">Smart Food Scale</span>
            </Link>

            <div className="ml-auto flex items-center gap-2">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="hidden rounded-md border border-[var(--rule)] px-2.5 py-1.5 text-sm text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-sunken)] hover:text-[var(--ink)] sm:block"
              >
                GitHub ↗
              </a>
              <ThemeToggle />
              <MobileNav />
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl gap-10 px-4 sm:px-6">
          <Sidebar />
          <main className="min-w-0 flex-1 py-10 lg:py-14">
            <article className="prose mx-auto max-w-[46rem]">{children}</article>
            <div className="mx-auto max-w-[46rem]">
              <PageNav />
            </div>
          </main>
        </div>

        <footer className="mt-16 border-t border-[var(--rule)] py-8">
          <div className="mx-auto max-w-7xl px-4 text-sm text-[var(--ink-faint)] sm:px-6">
            University IoT team project · the camera answers <em>what</em>, the load cell
            answers <em>how much</em>
          </div>
        </footer>
      </body>
    </html>
  );
}
