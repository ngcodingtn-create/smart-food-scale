import type { Metadata } from 'next';
import { MilestoneMap } from '@/components/admin/build/MilestoneMap';
import { MilestoneStepper, OverallCard } from '@/components/admin/build/Stepper';
import '@/components/admin/build/build.css';

export const metadata: Metadata = { title: 'Build map' };

export default function BuildMap() {
  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="label">Build · end to end</p>
        <h1>The build, milestone by milestone</h1>
        <p className="admin-page-lede">
          From naming the parts on the desk to a finished scale whose meals reach your phone. Each milestone opens into small steps, one
          idea each, with your own photos, the wiring lit up, and how to know it worked.
        </p>
      </header>
      <OverallCard />
      <MilestoneStepper />
      <MilestoneMap />
    </div>
  );
}
