## 2024-05-15 - Decorative Canvas Accessibility
**Learning:** Full-screen animated `<canvas>` elements used for backgrounds often lack `aria-hidden="true"`, causing screen readers to potentially misinterpret or incorrectly focus them.
**Action:** Always verify that non-interactive `<canvas>` backgrounds include `aria-hidden="true"` to prevent them from interfering with the semantic structure of the page.
