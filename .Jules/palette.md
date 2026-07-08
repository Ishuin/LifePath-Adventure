## 2024-05-15 - Verifying Keyboard Focus Styles
**Learning:** When adding `:focus-visible` styles for better keyboard navigation accessibility, standard mouse clicks do not trigger the styles in modern browsers, making them hard to verify manually with a mouse.
**Action:** Use Playwright scripts that simulate sequential keyboard navigation via `page.keyboard.press("Tab")` to accurately verify `:focus-visible` state enhancements without mouse interference.

## 2024-07-08 - Replacing JS Smooth Scroll with Native HTML/CSS
**Learning:** Using `<button>` elements with `onClick` JavaScript handlers (like `scrollIntoView`) for in-page section navigation breaks native semantic accessibility, as screen readers don't recognize them as links, and standard anchor features (like right-click or seeing the URL target) are lost.
**Action:** Always prefer semantic `<a href="#target">` anchor tags combined with CSS `html { scroll-behavior: smooth; }` for in-page navigation. It achieves the exact same visual effect with significantly better accessibility and zero JavaScript overhead. Ensure standard CSS resets (`text-decoration: none`, `display: inline-block`) are applied if styling the link to look like a button.
