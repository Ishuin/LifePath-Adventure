## 2024-05-20 - Keyboard Focus & Decorative Elements
**Learning:** Decorative background elements like full-page animated `<canvas>` components need to be explicitly hidden from screen readers using `aria-hidden="true"`. Also, interactive elements like `.nav-links a` and `.cta-button` lacked clear visual focus states for keyboard users.
**Action:** Added `:focus-visible` styles with a clear `outline` matching the theme color (`#4CAF50`) to ensure keyboard navigability is visually apparent. Always verify focus states and screen reader visibility for custom interactive components.
