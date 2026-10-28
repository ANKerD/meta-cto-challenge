import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Feature intelligence system",
  description: "Feature request intelligence",
};

export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}{modal}</body>
    </html>
  );
}
