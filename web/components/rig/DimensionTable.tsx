import { FOOTPRINTS } from './specs';

export function DimensionTable() {
  return (
    <div className="rig-dimensions">
      <table>
        <caption>Reference footprints in millimetres. Sources checked 21 September and 13 October 2026.</caption>
        <thead><tr><th scope="col">Component</th><th scope="col">Model dimensions (mm)</th><th scope="col">Evidence & confidence</th></tr></thead>
        <tbody>{FOOTPRINTS.map((row) => <tr key={row.part}>
          <th scope="row">{row.part}</th>
          <td>{row.dimensions}</td>
          <td><span className={`rig-confidence ${row.confidence === 'Estimate' || row.confidence === 'Mixed' ? 'rig-estimate' : ''}`}>{row.confidence}</span><p>{row.basis}</p><a href={row.href} target={row.href.startsWith('https') ? '_blank' : undefined} rel={row.href.startsWith('https') ? 'noreferrer noopener' : undefined}>{row.source}</a></td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}
