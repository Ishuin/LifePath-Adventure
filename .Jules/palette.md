## 2024-05-15 - Verifying Keyboard Focus Styles
**Learning:** When adding `:focus-visible` styles for better keyboard navigation accessibility, standard mouse clicks do not trigger the styles in modern browsers, making them hard to verify manually with a mouse.
**Action:** Use Playwright scripts that simulate sequential keyboard navigation via `page.keyboard.press("Tab")` to accurately verify `:focus-visible` state enhancements without mouse interference.
## 2026-07-05 - Semantic Links for In-Page Navigation
**Learning:** In-page navigation (e.g., scrolling to a section) was previously implemented using a `<button>` with JavaScript (`scrollIntoView`). This breaks native keyboard accessibility, screen reader expectations, and standard browser behavior for links.
**Action:** Always use semantic `<a>` tags with appropriate `href` targets (e.g., `<a href="#features">`) instead of `<button>` elements for navigation. When styling links to look like buttons, ensure CSS covers standard anchor resets like `text-decoration: none` and `display: inline-block`.
