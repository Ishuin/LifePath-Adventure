## 2024-05-31 - Canvas Decorative Elements and Keyboard Focus
**Learning:** Screen readers might try to read purely decorative, non-interactive `<canvas>` elements if not explicitly hidden, and interactive elements frequently lack proper `:focus-visible` states when they have custom `:hover` styling.
**Action:** Always add `aria-hidden="true"` to decorative canvas elements and ensure that whenever a custom `:hover` state is added to a link or button, an equivalent `:focus-visible` state is also implemented, with an explicit `outline` to support keyboard navigation.
