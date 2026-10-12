// This diagram is ordinary HTML/SVG: it is also rendered before JS loads.
export function RigFallback({
  message = 'Loading the interactive model…',
  note = 'The assembly description and dimension table below remain available.',
}: { message?: string; note?: string }) {
  return <div className="rig-fallback">
    <svg viewBox="0 0 620 390" role="img" aria-labelledby="rig-fallback-title rig-fallback-description">
      <title id="rig-fallback-title">Side view of the proposed food scale</title>
      <desc id="rig-fallback-description">The plate transfers its load through one end of a bar load cell. The other end fixes to the base. A separate arm holds a downward camera and LED ring above the plate.</desc>
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M143 304 H480 V333 H143 Z M450 304 V66 H318 V82 H432 V304" fill="var(--paper-sunken)" />
        <path d="M220 256 Q315 279 410 256 L399 269 Q315 287 231 269 Z" fill="var(--paper-raised)" />
        <path d="M266 282 H338 V290 H266 Z M270 290 V304 M332 282 V277" />
        <path d="M300 85 H339 V103 H300 Z M309 103 V113 H326 V103" fill="var(--accent-soft)" />
        <path d="M291 117 H344 M317 123 V244" stroke="var(--accent)" strokeDasharray="5 6" />
        <path d="M310 239 L317 246 L324 239" stroke="var(--accent)" />
      </g>
      <g fill="currentColor" fontFamily="system-ui, sans-serif" fontSize="14">
        <text x="48" y="92">Camera + light ring</text><text x="54" y="262">Plate</text>
        <text x="51" y="291">Load cell</text><text x="171" y="355">Stationary base</text>
        <text x="463" y="190">Fixed arm</text>
      </g>
      <g stroke="var(--ink-faint)" strokeWidth="1"><path d="M186 88 H286 M100 257 H212 M121 286 H258" /></g>
    </svg>
    <p role="status">{message}</p><p>{note}</p>
  </div>;
}
