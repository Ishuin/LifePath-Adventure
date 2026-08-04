## 2024-05-15 - Verifying Keyboard Focus Styles
**Learning:** When adding `:focus-visible` styles for better keyboard navigation accessibility, standard mouse clicks do not trigger the styles in modern browsers, making them hard to verify manually with a mouse.
**Action:** Use Playwright scripts that simulate sequential keyboard navigation via `page.keyboard.press("Tab")` to accurately verify `:focus-visible` state enhancements without mouse interference.

## 2026-07-11 - Preserving Visual Polish During Accessibility Fixes
**Learning:** Changing JavaScript-based navigation to semantic HTML links can unintentionally remove visual polish, such as smooth scrolling, if it was handled entirely via JS.
**Action:** When migrating interactive elements to semantic HTML equivalents, always verify if global CSS rules (like `scroll-behavior: smooth`) are present or need to be added to preserve the intended user experience.
## 2024-07-13 - Redundant Alt Text on Feature Icons
**Learning:** Images immediately adjacent to identical heading text cause redundant and annoying screen reader announcements if they have matching `alt` text.
**Action:** Use empty `alt=""` attributes for such images to treat them as decorative and skip redundant announcements.
## 2026-07-14 - Dynamic Accessibility Visually Hidden State
**Learning:** When strict constraints prevent adding custom CSS (like `.sr-only`) but accessibility requires visually hidden elements that become visible on focus (like skip links), React's inline styles combined with `onFocus`/`onBlur` event state can provide a viable, though less idiomatic, workaround.
**Action:** Use inline styles to toggle `position: absolute`, `left`, and `clip` properties dynamically based on local focus state when custom CSS is prohibited.

## 2026-07-16 - Canvas Animation prefers-reduced-motion
**Learning:** Continuous background canvas animations powered by `requestAnimationFrame` are entirely disconnected from CSS media queries and will violate WCAG guidelines by running indefinitely for users with reduced motion preferences.
**Action:** When implementing custom JS/canvas animations, explicitly query `window.matchMedia('(prefers-reduced-motion: reduce)')` to conditionally skip or halt the recursive animation loop, providing a static fallback frame.

## 2024-03-24 - Comprehensive Reduced Motion Support
**Learning:** Checking `prefers-reduced-motion` in JS for canvas animations is good, but it leaves CSS animations and smooth scrolling active. To fully support users with vestibular disorders, we need a CSS `@media (prefers-reduced-motion: reduce)` block to catch all CSS animations, transitions, and scroll behaviors.
**Action:** Always include a CSS block targeting `*, *::before, *::after` with `animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important;` when implementing reduced motion, in addition to any JS-specific logic.

## 2024-07-21 - Brand Colors and Contrast Failures
**Learning:** Using white text (`#fff`) on brand green backgrounds (like `#4CAF50`) often fails WCAG AA contrast requirements (ratio 2.78:1 instead of required 4.5:1).
**Action:** Always verify color contrast for primary buttons and skip links against their backgrounds. Use a dark background color (like the app's `#050a19`) or black for text on light/medium backgrounds to ensure readability and compliance.
## 2024-07-22 - Untracked Node Modules Blocking Git Operations
**Learning:** During frontend verification or test runs, standard `pnpm install` generates a `node_modules` directory. If this directory is not in `.gitignore`, subsequent git operations (like `git status`, `git checkout`, or `git apply`) can hang, fail with diff size warnings, or significantly slow down the workflow.
**Action:** When working in repositories with `package.json`, proactively ensure `node_modules/` is in `.gitignore` before running build or install commands to keep the git working tree clean and performant.
## 2024-07-23 - Focus and Hover Visual Parity
**Learning:** Keyboard users often miss out on the rich visual feedback (like animated underlines, color shifts, and scale transforms) provided to mouse users via `:hover` states, which degrades the overall interactive experience for accessibility-focused navigation.
**Action:** Always map `:focus-visible` states to mirror `:hover` interactions for interactive elements like navigation links and call-to-action buttons. Ensure both states share the same transition properties and visual lifts to maintain parity between input methods.
## 2024-07-23 - Screen Reader Semantic Landmarks
**Learning:** Simply using `<section>` elements without naming them creates generic regions that are unhelpful to screen reader users trying to jump through content.
**Action:** Enhance `<section>` landmarks by linking them to their corresponding heading elements via `aria-labelledby` (e.g., `<section aria-labelledby="heading-id"><h2 id="heading-id">...`). This assigns a descriptive, semantic name to the landmark region, significantly improving spatial navigation for assistive technologies.
## 2024-05-24 - Sticky Position and Overflow
**Learning:** `overflow: hidden` on a parent container breaks `position: sticky` for descendants. `overflow: clip` is a modern alternative that hides overflow without trapping sticky positioning.
**Action:** Replace `overflow: hidden` with `overflow: clip` when sticky positioning is required within a container that needs to hide overflow.
## 2024-07-25 - Playwright Triggering Active States
**Learning:** Playwright's `element.hover()` followed by `element.evaluate` with MouseEvents doesn't consistently trigger CSS `:active` states for screenshots.
**Action:** To reliably capture `:active` states in Playwright scripts, calculate the element's bounding box and use explicit `page.mouse.move(x, y)` followed by `page.mouse.down()` and `page.mouse.up()`.

## 2024-07-25 - Tactile Feedback for Interactive Elements
**Learning:** Providing `:hover` visual cues (like scaling up) is good, but without a corresponding `:active` state, interactions can feel hollow or unresponsive when actually clicked.
**Action:** Enhance tactile visual feedback for interactive elements (e.g., buttons, logos, links) by adding `:active` CSS pseudo-classes with subtle transformations (e.g., `transform: scale(0.95)` or removing hover lift) to simulate a physical button press.

## 2024-07-27 - Dark Theme Browser UI Consistency
**Learning:** Even with a dark background on `body`, native browser UI elements like scrollbars may remain bright white if the browser is not explicitly informed of the color scheme. Mixing inline styles and class-based CSS can also lead to maintenance issues and inconsistent overrides.
**Action:** Always add `color-scheme: dark;` to the `html` selector for dark-themed apps to ensure native browser controls (like scrollbars) match the dark aesthetic. Additionally, migrate inline styles to CSS classes to ensure separation of concerns and allow for centralized pseudo-class (e.g., hover/focus) enhancements.
## 2026-07-29 - Unique ARIA Live Updates for Disabled Links
**Learning:** When using React state to manage an `aria-live` region for screen reader feedback on disabled elements, consecutively clicking different disabled elements that trigger the exact same string (e.g., "Coming soon") will not cause React to update the DOM. Without a DOM update, the screen reader won't re-announce the message. Providing unique, context-specific strings (e.g., "Gallery is coming soon", "Contact is coming soon") ensures state updates and re-announcements.
**Action:** Always include specific contextual data (like the link's name) in generic screen reader state messages to guarantee uniqueness for consecutive identical actions.
## 2024-07-30 - ARIA Live Region State Flushing
**Learning:** Appending a timestamp (e.g. `Date.now()`) to an `aria-live` string to force a re-render causes screen readers to audibly read the literal timestamp numbers to the user, creating a severe accessibility regression.
**Action:** To guarantee consecutive identical announcements are read by a screen reader, clear the React state string first and then set the new string using a short timeout (e.g., `setTimeout(() => setAnnouncement(message), 50);`) instead of polluting the string with timestamps or random characters.

## 2024-08-02 - In-page Navigation Focus Routing
**Learning:** Native anchor links for in-page navigation (e.g. `<a href="#features">`) scroll the page correctly but do not transfer keyboard focus to the target element unless that target element is programmatically focusable. This breaks keyboard navigation, as subsequent tabs start from the original anchor link instead of the newly scrolled section.
**Action:** When implementing semantic `<section>` landmarks that are targets of in-page anchor navigation, always append `tabIndex="-1"` to the target element and apply a `:focus { outline: none; }` CSS rule. This ensures keyboard focus follows the visual scroll state while suppressing unwanted focus rings for mouse users.
## 2024-05-18 - Missing Project Test Scripts\n**Learning:** The 'lifepath-adventure' repository does not have a test script defined in its `package.json`. Planning to run `pnpm test` will fail the Groundedness Rule during code review.\n**Action:** Always omit `pnpm test` from execution plans for this specific repository and rely solely on `pnpm lint` and `pnpm build` for project-wide verifications.
