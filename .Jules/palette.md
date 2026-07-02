## 2024-05-15 - Verifying Keyboard Focus Styles
**Learning:** When adding `:focus-visible` styles for better keyboard navigation accessibility, standard mouse clicks do not trigger the styles in modern browsers, making them hard to verify manually with a mouse.
**Action:** Use Playwright scripts that simulate sequential keyboard navigation via `page.keyboard.press("Tab")` to accurately verify `:focus-visible` state enhancements without mouse interference.

## 2026-07-02 - Semantic In-Page Navigation
**Learning:** Using JavaScript `scrollIntoView` attached to a `<button>` for in-page navigation breaks standard keyboard accessibility and screen reader expectations for links.
**Action:** For in-page navigation (e.g., scrolling to a section), always use semantic `<a>` tags with appropriate `href` targets instead of `<button>` elements to maintain correct keyboard and screen reader behavior. When styling links to look like buttons, ensure CSS covers standard anchor resets like `text-decoration: none` and `display: inline-block`.
