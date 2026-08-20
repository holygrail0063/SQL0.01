import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QueryRight — Practice SQL Like It's Your Job",
  description: "Build real SQL skills by solving realistic business problems against hands-on training databases directly in your browser.",
  openGraph: {
    title: "QueryRight — Practice SQL Like It's Your Job",
    description: "Build real SQL skills by solving realistic business problems against hands-on training databases directly in your browser.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
