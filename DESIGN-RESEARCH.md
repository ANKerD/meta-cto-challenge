# Design direction

Use [Linear's interface](https://linear.app/now/how-we-redesigned-the-linear-ui) as the visual reference for this project. Use a light theme. Favor restrained color, clear hierarchy, subtle borders, compact controls, and consistent alignment. Do not copy Linear's name, logo, or product content.

Define semantic colors in `src/app/globals.css`. Use the controls in `src/components/ui/controls.tsx` for forms. Add a shared control when a new screen needs one, rather than styling the same control in each feature. Use the standard Tailwind spacing scale.

ESLint restricts native form controls outside `src/components/ui/`, inline styles, arbitrary Tailwind values, and named Tailwind colors in JSX. These checks catch common deviations but do not judge visual quality. Inspect each changed screen in a browser, including focus, validation, and disabled states.
