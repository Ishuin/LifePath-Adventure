## 2024-05-29 - Missing ARIA Labels on Decorative Elements and Missing Keyboard Focus

**Learning:** Discovered that purely decorative full-screen animations (like the canvas in `.background`) were lacking `aria-hidden="true"`, which could cause screen readers to unnecessarily focus or describe them, leading to a poorer experience. Additionally, several interactive elements like `.cta-button` and navigation links lacked visible focus states (`:focus-visible`), hindering keyboard navigation.
**Action:** Always ensure that purely decorative or background animated elements include `aria-hidden="true"`. Also, always define a clear, visible `:focus-visible` state for interactive elements to ensure accessibility for keyboard users, and an `:active` state for tactile feedback on buttons.
