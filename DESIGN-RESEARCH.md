# Design research

The design direction has not been selected.

## References

- [GitHub Primer](https://primer.style/): a documented design system with foundations, patterns, and components for GitHub workflows. Its React components may provide a starting point for request forms and lists.
- [Atlassian Design System](https://atlassian.design/): a design system for product and issue management tools. It provides components and semantic tokens for color, spacing, typography, and elevation.
- [Linear's interface redesign](https://linear.app/now/how-we-redesigned-the-linear-ui): a product interface reference for issue tracking. The team describes reducing visual noise and increasing navigation density. This is inspiration, not a published component library selected for this project.

## Proposed guardrails after selecting a direction

1. Use the chosen system's components and tokens where they fit. Define any project-specific tokens in one place.
2. Put shared controls in `src/components/ui/` and use them across product screens. Add new controls when a screen needs them.
3. Add concise instructions to `AGENTS.md` pointing to the design rules and requiring existing controls and tokens.
4. Add focused lint rules for agreed constraints, such as avoiding raw colors or inline styles outside the shared UI layer. Verify the rules against an example violation.
5. Check new screens in a browser for layout, states, and accessibility. Automated rules cannot determine visual quality by themselves.

The specific library, tokens, component boundaries, and enforcement rules require a decision before implementation.
