import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const designRules = [
  {
    selector: 'JSXAttribute[name.name="style"]',
    message: "Use semantic design tokens instead of inline styles.",
  },
  {
    selector: 'JSXAttribute[name.name="className"] > Literal[value=/\\[/]',
    message: "Use standard Tailwind scales and semantic tokens instead of arbitrary values.",
  },
  {
    selector: 'JSXAttribute[name.name="className"] > Literal[value=/(bg|text|border|ring|outline)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(-|\\b)/]',
    message: "Use semantic color tokens instead of named Tailwind colors.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: { "no-restricted-syntax": ["error", ...designRules] },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**"],
    rules: {
      "no-restricted-syntax": ["error", ...designRules, {
        selector: 'JSXOpeningElement[name.name=/^(button|input|textarea|select)$/]',
        message: "Use or add a shared control in src/components/ui/.",
      }],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
