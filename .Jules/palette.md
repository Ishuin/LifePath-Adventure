## 2024-05-24 - Screen reader compatibility for canvas animations
**Learning:** Screen readers might attempt to announce or interact with animated background canvas elements if they aren't explicitly hidden, creating noise for accessibility users.
**Action:** Always add `aria-hidden="true"` to purely decorative canvas containers to ensure a clean experience for screen reader users.

## 2024-05-24 - Focus visible styles for modern web apps
**Learning:** Custom styled buttons and links often lose default browser focus outlines, making keyboard navigation difficult or impossible for accessibility users.
**Action:** Always add explicit `:focus-visible` styles with a high contrast outline (using `outline` and `outline-offset`) to interactive elements like custom buttons and nav links.