'use client';

import { useState } from 'react';
import type { Photo } from '../roadmap';

/**
 * The owner's own photo with numbered points on it. Tap a point, or its line
 * in the list, to read it. The list carries everything the dots do, so
 * nothing depends on seeing the photo.
 *
 * `view` frames the part: a window onto the photo, in percent, so the board
 * fills the picture instead of the desk around it. The points stay in the
 * photo's own percentages and are moved into the window here.
 */
export function PhotoHotspots({ photo }: { photo: Photo }) {
  const { file, alt, spots, size, view = [0, 0, 100, 100] } = photo;
  const [vx, vy, vw, vh] = view;
  const [active, setActive] = useState(0);
  const spot = spots[active];

  return (
    <div className="hotspots">
      <div className="hotspots-photo" style={{ aspectRatio: `${size[0] * vw} / ${size[1] * vh}` }}>
        <img
          src={`/workbench/kit/${file}`}
          alt={alt}
          style={{ width: `${(100 / vw) * 100}%`, left: `${(-vx / vw) * 100}%`, top: `${(-vy / vh) * 100}%` }}
        />
        {spots.map((item, index) => (
          <button
            key={item.label}
            type="button"
            className="hotspot"
            style={{ left: `${((item.x - vx) / vw) * 100}%`, top: `${((item.y - vy) / vh) * 100}%` }}
            aria-pressed={index === active}
            aria-label={`${index + 1}: ${item.label}`}
            onClick={() => setActive(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      {spot ? (
        <p className="hotspot-now" aria-live="polite">
          <strong>
            {active + 1}. {spot.label}
          </strong>{' '}
          {spot.note}
        </p>
      ) : null}
      <ol className="hotspot-list">
        {spots.map((item, index) => (
          <li key={item.label}>
            <button type="button" aria-pressed={index === active} onClick={() => setActive(index)}>
              <span className="hotspot-num">{index + 1}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
