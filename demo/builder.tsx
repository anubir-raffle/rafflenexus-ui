// The Raffle Builder on its own page (Miguel, 2026-10-20: "can we get a standalone preview of it"): the setup form and its live
// site preview, full width, without the rest of the design-system demo. Same component as the demo page's wizard section.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/fonts-dev.css';
import '../styles/tokens.css';
import '../styles/components.css';
import './demo.css';
import { WizardDemo } from './WizardDemo';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="demo-builder-page">
      <WizardDemo />
    </main>
  </StrictMode>,
);
