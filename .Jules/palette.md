## 2024-05-15 - Verifying Keyboard Focus Styles
**Learning:** When adding `:focus-visible` styles for better keyboard navigation accessibility, standard mouse clicks do not trigger the styles in modern browsers, making them hard to verify manually with a mouse.
**Action:** Use Playwright scripts that simulate sequential keyboard navigation via `page.keyboard.press("Tab")` to accurately verify `:focus-visible` state enhancements without mouse interference.

## 2024-07-01 - Semantic Links for In-Page Navigation
**Learning:** Using `<button>` with click handlers for in-page scrolling breaks semantic meaning and accessibility features.
**Action:** Always use semantic `<a>` tags with `href` targets for in-page navigation and apply standard anchor CSS resets when styling them as buttons.
