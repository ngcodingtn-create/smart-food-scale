import { SiteShell } from '@/components/SiteShell';

/** Every public page: the sidebar, breadcrumb, outline and footer. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
