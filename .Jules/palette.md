## 2024-05-19 - Screen Reader Noise from Decorative Canvas
**Learning:** Animated canvas elements used purely for visual flair (like the point/line connection animation in Lifepath Adventure) can create unnecessary noise and distraction for screen reader users if they aren't explicitly hidden from accessibility APIs.
**Action:** Always wrap purely decorative `<canvas>` background elements in a container with `aria-hidden="true"` to ensure a clean experience for assistive technologies.
