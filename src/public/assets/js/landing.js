
// ════════════════════════════════════════════
// LANDING — wiring page-specific modules
// ════════════════════════════════════════════
import { initProducts } from './products.js';

// navbar.js auto-inits itself. Only init products on landing page.
document.addEventListener('DOMContentLoaded', () => {
  initProducts();
});
