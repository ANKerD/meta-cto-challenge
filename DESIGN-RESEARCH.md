# Design direction

Use [Linear's interface](https://linear.app/now/how-we-redesigned-the-linear-ui) as the visual reference for this project. Use a light theme. Favor restrained color, clear hierarchy, subtle borders, compact controls, and consistent alignment. Do not copy Linear's name, logo, or product content.

Use Lucide icons for actions where they improve recognition. Use 16px icons in controls, hide decorative icons from assistive technology, and keep a visible or accessible action label. Avoid decorative icons.

Define semantic colors in `src/app/globals.css`. Use the controls in `src/components/ui/controls.tsx` for forms. Give actionable controls visible colors suited to their purpose. Use distinct colors for creating requests and voting, and indicate selected states clearly. Use the shared red `CloseButton` for modal close actions. Add a shared control when a new screen needs one, rather than styling the same control in each feature. Use the standard Tailwind spacing scale. Keep lists and forms compact. Place related metadata on the same line when space allows, and wrap on narrow screens.

ESLint restricts native form controls outside `src/components/ui/`, inline styles, arbitrary Tailwind values, and named Tailwind colors in JSX. These checks catch common deviations but do not judge visual quality. Inspect each changed screen in a browser, including focus, validation, and disabled states.

Show ticket statuses as compact chips with a text label and a Lucide icon. Use semantic status colors, and never rely on color alone.
