## 2024-05-18 - Redundant Announcements & Focus Indicators
**Learning:** Decorative images sharing text with adjacent headings create redundant announcements for screen readers. Custom-styled interactive elements lack explicit focus indicators.
**Action:** Use empty alt text (`alt=""`) and `aria-hidden="true"` for decorative images. Add explicit `:focus-visible` styles to ensure keyboard accessibility.
