## 2024-05-15 - Verifying Keyboard Focus Styles
**Learning:** When adding `:focus-visible` styles for better keyboard navigation accessibility, standard mouse clicks do not trigger the styles in modern browsers, making them hard to verify manually with a mouse.
**Action:** Use Playwright scripts that simulate sequential keyboard navigation via `page.keyboard.press("Tab")` to accurately verify `:focus-visible` state enhancements without mouse interference.

## 2026-07-11 - Preserving Visual Polish During Accessibility Fixes
**Learning:** Changing JavaScript-based navigation to semantic HTML links can unintentionally remove visual polish, such as smooth scrolling, if it was handled entirely via JS.
**Action:** When migrating interactive elements to semantic HTML equivalents, always verify if global CSS rules (like `scroll-behavior: smooth`) are present or need to be added to preserve the intended user experience.
## 2024-07-13 - Redundant Alt Text on Feature Icons
**Learning:** Images immediately adjacent to identical heading text cause redundant and annoying screen reader announcements if they have matching `alt` text.
**Action:** Use empty `alt=""` attributes for such images to treat them as decorative and skip redundant announcements.
