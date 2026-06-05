## 2023-10-27 - Keyboard Navigation Visibility
**Learning:** Default browser focus states are frequently overridden or insufficient for custom-styled navigation and CTA components, leading to poor keyboard accessibility out of the box for Vite/React boilerplates without additional CSS.
**Action:** Proactively ensure `:focus-visible` pseudo-class styles with clear `outline` and `outline-offset` are implemented for all interactive elements to improve a11y.
