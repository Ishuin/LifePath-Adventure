## 2024-05-15 - Redundant Image Alt Text
**Learning:** Images adjacent to identical headings with the same alt text cause screen readers to redundantly announce the text twice in a row, harming the user experience.
**Action:** Treat such images as decorative by setting `alt="" aria-hidden="true"` so they are ignored by screen readers.
