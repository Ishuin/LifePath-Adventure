## 2024-05-28 - Screen Reader Clarity for Decorative Elements
**Learning:** Purely decorative `<canvas>` backgrounds and images that duplicate adjacent text (like card headers) create unnecessary noise and confusion for screen reader users.
**Action:** Always add `aria-hidden="true"` to purely decorative visual elements (like background canvases) and use `alt="" aria-hidden="true"` for images when the information is already conveyed by adjacent textual headers.
