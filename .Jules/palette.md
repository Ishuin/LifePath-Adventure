## 2024-05-18 - Improve Screen Reader Experience & Keyboard Nav
**Learning:** Decorative feature card images without explicit empty `alt` attributes and `aria-hidden` are still read by screen readers, creating redundant noise. Keyboard navigation for `.nav-links` and CTA buttons lacks a clear visual focus state, violating WCAG 2.1 Success Criterion 2.4.7 (Focus Visible).
**Action:** Always explicitly set `alt=""` and `aria-hidden="true"` on decorative images. Always explicitly add `:focus-visible` styles with a clear outline or ring for all interactive elements to support keyboard users.
