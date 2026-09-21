import Link from 'next/link';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p>
        That page isn&apos;t here. The project is mid-build, so a link may point at
        something not written yet.
      </p>
      <p>
        The <Link href="/deliverables">status board</Link> lists what exists and what
        doesn&apos;t. Otherwise, try the sidebar.
      </p>
    </>
  );
}
