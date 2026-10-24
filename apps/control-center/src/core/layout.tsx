import { jsx } from 'hono/jsx';
import { html } from 'hono/html';
import { adminCss } from './styles.js';
import { globalCss } from './global.style.js';

export interface ModuleManifest {
  id: string;
  title: string;
  icon: string;
  path: string;
}

interface LayoutProps {
  currentModuleId: string;
  modules: ModuleManifest[];
  children: any;
}

export const Layout = ({ currentModuleId, modules, children }: LayoutProps) => {
  return (
    <html lang='de' data-theme='dark'>
      <head>
        <meta charset='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <title>ioUnfold // Control Center</title>
        <link
          rel='stylesheet'
          href='https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css'
        />
        <link rel='stylesheet' href='/global.styles.css' />
        <script src='https://unpkg.com/htmx.org@1.9.10'></script>
        <script src='https://unpkg.com/htmx.org@1.9.10/dist/ext/sse.js'></script>
      </head>
      <body>
        <nav class='container-fluid'>
          <ul>
            <li>
              <span class='brand-title'>ioUnfold</span>
              <small style='margin-left: 0.5rem; color: var(--pico-muted-color); font-family: monospace;'>
                // Control Center
              </small>
            </li>
          </ul>
          <ul>
            {modules.map((mod) => {
              const isActive = currentModuleId === mod.id;
              return (
                <li key={mod.id}>
                  <a
                    href={mod.path}
                    class={isActive ? 'contrast' : 'secondary'}
                    hx-get={mod.path}
                    hx-target='#main-content'
                    hx-push-url='true'
                    style={
                      isActive
                        ? 'border-bottom: 2px solid var(--pico-primary);'
                        : ''
                    }
                  >
                    <span style='margin-right: 0.3rem;'>{mod.icon}</span>
                    {mod.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <main id='main-content' class='container'>
          {children}
        </main>
      </body>
    </html>
  );
};
