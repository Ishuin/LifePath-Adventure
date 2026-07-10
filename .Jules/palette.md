## 2024-05-15 - Verifying Keyboard Focus Styles
**Learning:** When adding `:focus-visible` styles for better keyboard navigation accessibility, standard mouse clicks do not trigger the styles in modern browsers, making them hard to verify manually with a mouse.
**Action:** Use Playwright scripts that simulate sequential keyboard navigation via `page.keyboard.press("Tab")` to accurately verify `:focus-visible` state enhancements without mouse interference.

## 2024-10-27 - Semantic HTML for Anchor Links
**Learning:** Using JS to handle scrolling to a section (`scrollIntoView`) on a `<button>` element is an accessibility anti-pattern. Screen readers expect a `<button>` to trigger an action and an `<a>` tag to navigate.
**Action:** Always use semantic `<a>` tags for in-page navigation. Update the CSS to ensure the anchor tag styling matches a button design using `display: inline-block` and `text-decoration: none`.
