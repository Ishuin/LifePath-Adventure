## 2024-06-19 - Semantic Navigation Elements and Visible Focus
**Learning:** Found `<button>` tags being used for in-page navigation (e.g., `#features`) instead of semantic `<a>` tags. Additionally, many interactive elements lacked `:focus-visible` styles, making keyboard navigation difficult and inaccessible.
**Action:** Always use semantic `<a>` tags with appropriate `href` targets for navigation. Ensure all interactive elements, including links and customized buttons, have clear `:focus-visible` states (e.g., using `outline`) to support keyboard users.
