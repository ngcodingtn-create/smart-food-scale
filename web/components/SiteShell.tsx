import { Breadcrumb } from '@/components/Breadcrumb';
import { PageNav } from '@/components/PageNav';
import { MobileBar, Sidebar } from '@/components/Sidebar';
import { Toc } from '@/components/Toc';
import { REPO_URL } from '@/lib/nav';

/**
 * The public site's frame: sidebar, top bar on small screens, breadcrumb,
 * article, outline and footer. Used by app/(site)/layout.tsx and by the 404
 * page, which renders under the root layout alone. /admin has its own frame.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
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
              University IoT team project · the camera answers <em>what</em>, the load cell answers{' '}
              <em>how much</em>
            </span>
            <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
              Source on GitHub
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}
