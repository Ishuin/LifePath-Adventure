## 2024-05-15 - Verifying Keyboard Focus Styles
**Learning:** When adding `:focus-visible` styles for better keyboard navigation accessibility, standard mouse clicks do not trigger the styles in modern browsers, making them hard to verify manually with a mouse.
**Action:** Use Playwright scripts that simulate sequential keyboard navigation via `page.keyboard.press("Tab")` to accurately verify `:focus-visible` state enhancements without mouse interference.

## 2026-07-07 - Semantic anchor for smooth scrolling
**Learning:** For in-page navigation (e.g., scrolling to a section), using a `<button>` with JavaScript (`scrollIntoView`) breaks semantic HTML and degrades keyboard accessibility/screen reader experience, when a native CSS solution (`scroll-behavior: smooth`) exists.
**Action:** Always use semantic `<a>` tags with appropriate `href` targets instead of `<button>` elements for in-page navigation, and rely on native CSS smooth scrolling when possible. Ensure CSS covers standard anchor resets like `text-decoration: none` and `display: inline-block` when styling links to look like buttons.
