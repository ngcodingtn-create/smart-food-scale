import { NODES, endName, gpiosOf, wiresOf, type NodeId } from './wiring';

const nodeOf = (id: NodeId) => {
  const node = NODES.find((item) => item.id === id);
  if (!node) throw new Error(`No node "${id}" in wiring.ts.`);
  return node;
};

/** The GPIOs one board uses, read from wiring.ts: the same list the firmware's pin header is made from. */
export function PinTable({ node: id }: { node: NodeId }) {
  const node = nodeOf(id);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>GPIO</th>
            <th>Printed on the board</th>
            <th>Goes to</th>
            <th>In the firmware</th>
          </tr>
        </thead>
        <tbody>
          {gpiosOf(node).map(({ number, name, wire }) => {
            const [board, other] = wire.from.part === node.parts[0].id ? [wire.from, wire.to] : [wire.to, wire.from];
            return (
              <tr key={name}>
                <td>{number}</td>
                <td>{board.pin}</td>
                <td>
                  {endName(node, other)}
                  {wire.through ? `, through ${wire.through}` : ''}
                </td>
                <td>
                  <code>PIN_{name}</code>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** How many wires each board takes, for a sentence. */
export function wireCount(id: NodeId) {
  return wiresOf(nodeOf(id)).length;
}
