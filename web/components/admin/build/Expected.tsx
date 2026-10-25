import type { Expected as ExpectedShape } from '../roadmap';

/**
 * What the board or a page should show, drawn like the thing itself: the
 * OLED's white on black with its three lines, or the serial log's mono text.
 */
export function Expected({ expect }: { expect: ExpectedShape }) {
  return (
    <figure className="expected" data-kind={expect.kind}>
      <p className="expected-label">
        {expect.kind === 'display' ? 'The display shows' : expect.kind === 'serial' ? 'The board prints' : 'The page shows'}
      </p>
      {expect.kind === 'display' ? (
        <div className="oled" role="img" aria-label={`The display: ${expect.lines.join(', ')}`}>
          {expect.lines.map((line, index) => (
            <span key={index} className={index === 1 ? 'oled-big' : 'oled-small'}>
              {line}
            </span>
          ))}
        </div>
      ) : (
        <pre className="expected-lines">{expect.lines.join('\n')}</pre>
      )}
      {expect.caption ? <figcaption>{expect.caption}</figcaption> : null}
    </figure>
  );
}
