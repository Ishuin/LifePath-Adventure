## 2024-06-28 - In-Page Navigation Accessibility
**Learning:** For in-page navigation (e.g., scrolling to a section), using `<button>` elements breaks native screen reader semantics and correct keyboard navigation behavior since buttons don't have an `href`. Users expect standard link behavior for navigation.
**Action:** Always use semantic `<a>` tags with appropriate `href` targets instead of `<button>` elements for in-page navigation. Apply button-like CSS classes and ensure `:focus-visible` states are present to maintain both correct visual appearance and keyboard accessibility.
