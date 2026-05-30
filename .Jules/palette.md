## 2026-05-30 - Focus States and Hidden Canvas
**Learning:** Adding `:focus-visible` states specifically targeting keyboard navigation is crucial to make the app accessible without impacting mouse users. Adding `aria-hidden="true"` effectively hides decorative animated elements that provide no semantic value from assistive technology.
**Action:** Consistently apply `:focus-visible` with high contrast outlines for interactive elements and `aria-hidden` for any purely decorative UI.
