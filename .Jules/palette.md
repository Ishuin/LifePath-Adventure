## 2026-06-22 - Semantic In-Page Navigation
**Learning:** Using a `<button>` element for in-page navigation (scrolling to a section) is an accessibility anti-pattern. Screen readers and keyboard users expect semantic anchor links (`<a>`) with proper `href` targets for navigation, whereas buttons are meant for actions/submissions.
**Action:** Always use semantic `<a href="#target">` tags instead of `<button>` elements for internal page links, and ensure they have a clear `:focus-visible` state for keyboard accessibility.
