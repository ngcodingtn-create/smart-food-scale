import { SHELVES, type Tool } from './tools';
import './workbench.css';

const CHECKED: Record<Tool['checked'], string> = {
  ran: 'ran it',
  read: 'read its docs',
  memory: 'not checked',
};

/** Every outside tool, shelf by shelf. */
export function Toolbox() {
  return (
    <div className="toolbox">
      {SHELVES.map((shelf) => (
        <section key={shelf.title}>
          <p className="label">{shelf.title}</p>
          <ul>
            {shelf.tools.map((tool) => (
              <li key={tool.name} className="tool">
                <p className="tool-name">
                  <a href={tool.href} target="_blank" rel="noreferrer noopener">
                    {tool.name}
                  </a>
                  <span data-kind={tool.frame ? 'frame' : 'link'}>{tool.frame ? 'runs in our pages' : 'link only'}</span>
                  <span data-kind={tool.checked}>{CHECKED[tool.checked]}</span>
                </p>
                <p className="tool-does">{tool.does}</p>
                <p className="tool-limit">{tool.limit}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
