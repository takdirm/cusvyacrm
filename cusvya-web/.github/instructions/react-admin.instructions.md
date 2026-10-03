---
applyTo: '**/*.tsx,**/*.ts,**/*.jsx,**/*.js'
---

This is the Cusvya Web React application.

Use the existing component architecture.

Before creating a new component, check whether an
existing reusable component can be used.

API calls must use the existing API service layer.

UI theme consistency requirements:
- Keep status tags and badges visually consistent across admin screens.
- Use high-contrast, solid status colors (avoid foggy/pastel tags for critical statuses).
- Prefer white text with strong background + matching border for colored tags.
- Reuse shared style maps/constants for status tags where possible instead of ad-hoc per-screen colors.
