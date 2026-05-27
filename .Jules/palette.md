## 2024-05-14 - Redundant Alt Text in Feature Cards
**Learning:** Screen readers announce redundant information when an image has `alt` text that matches the exact text of the `<h3>` header immediately following it (e.g., `<img alt="Explore"> <h3>Explore</h3>`).
**Action:** Use `alt=""` and `aria-hidden="true"` on these decorative images so they are properly skipped by screen readers, creating a cleaner audio experience.
