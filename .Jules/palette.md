## 2024-05-15 - Verifying Keyboard Focus Styles
**Learning:** When adding `:focus-visible` styles for better keyboard navigation accessibility, standard mouse clicks do not trigger the styles in modern browsers, making them hard to verify manually with a mouse.
**Action:** Use Playwright scripts that simulate sequential keyboard navigation via `page.keyboard.press("Tab")` to accurately verify `:focus-visible` state enhancements without mouse interference.

## 2024-05-16 - Smooth Scrolling Fallbacks
**Learning:** Replacing JS-based smooth scrolling implementations (`scrollIntoView({ behavior: 'smooth' })`) with semantic anchor tags (`<a>`) causes instant snapping to the target section if the global CSS rule `html { scroll-behavior: smooth; }` is missing or overridden, breaking the previously smooth interaction.
**Action:** Always verify the presence of `html { scroll-behavior: smooth; }` in the global stylesheet when migrating JS navigation to semantic anchor tags to preserve the intended UX flow.
