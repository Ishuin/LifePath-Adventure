## 2024-05-15 - Verifying Keyboard Focus Styles
**Learning:** When adding `:focus-visible` styles for better keyboard navigation accessibility, standard mouse clicks do not trigger the styles in modern browsers, making them hard to verify manually with a mouse.
**Action:** Use Playwright scripts that simulate sequential keyboard navigation via `page.keyboard.press("Tab")` to accurately verify `:focus-visible` state enhancements without mouse interference.

## 2026-07-11 - Preserving Visual Polish During Accessibility Fixes
**Learning:** Changing JavaScript-based navigation to semantic HTML links can unintentionally remove visual polish, such as smooth scrolling, if it was handled entirely via JS.
**Action:** When migrating interactive elements to semantic HTML equivalents, always verify if global CSS rules (like `scroll-behavior: smooth`) are present or need to be added to preserve the intended user experience.
## 2024-07-13 - Redundant Alt Text on Feature Icons
**Learning:** Images immediately adjacent to identical heading text cause redundant and annoying screen reader announcements if they have matching `alt` text.
**Action:** Use empty `alt=""` attributes for such images to treat them as decorative and skip redundant announcements.
## 2026-07-14 - Dynamic Accessibility Visually Hidden State
**Learning:** When strict constraints prevent adding custom CSS (like `.sr-only`) but accessibility requires visually hidden elements that become visible on focus (like skip links), React's inline styles combined with `onFocus`/`onBlur` event state can provide a viable, though less idiomatic, workaround.
**Action:** Use inline styles to toggle `position: absolute`, `left`, and `clip` properties dynamically based on local focus state when custom CSS is prohibited.

## 2026-07-16 - Canvas Animation prefers-reduced-motion
**Learning:** Continuous background canvas animations powered by `requestAnimationFrame` are entirely disconnected from CSS media queries and will violate WCAG guidelines by running indefinitely for users with reduced motion preferences.
**Action:** When implementing custom JS/canvas animations, explicitly query `window.matchMedia('(prefers-reduced-motion: reduce)')` to conditionally skip or halt the recursive animation loop, providing a static fallback frame.

## 2024-03-24 - Comprehensive Reduced Motion Support
**Learning:** Checking `prefers-reduced-motion` in JS for canvas animations is good, but it leaves CSS animations and smooth scrolling active. To fully support users with vestibular disorders, we need a CSS `@media (prefers-reduced-motion: reduce)` block to catch all CSS animations, transitions, and scroll behaviors.
**Action:** Always include a CSS block targeting `*, *::before, *::after` with `animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important;` when implementing reduced motion, in addition to any JS-specific logic.

## 2024-07-21 - Brand Colors and Contrast Failures
**Learning:** Using white text (`#fff`) on brand green backgrounds (like `#4CAF50`) often fails WCAG AA contrast requirements (ratio 2.78:1 instead of required 4.5:1).
**Action:** Always verify color contrast for primary buttons and skip links against their backgrounds. Use a dark background color (like the app's `#050a19`) or black for text on light/medium backgrounds to ensure readability and compliance.
## 2024-07-22 - Untracked Node Modules Blocking Git Operations
**Learning:** During frontend verification or test runs, standard `pnpm install` generates a `node_modules` directory. If this directory is not in `.gitignore`, subsequent git operations (like `git status`, `git checkout`, or `git apply`) can hang, fail with diff size warnings, or significantly slow down the workflow.
**Action:** When working in repositories with `package.json`, proactively ensure `node_modules/` is in `.gitignore` before running build or install commands to keep the git working tree clean and performant.
