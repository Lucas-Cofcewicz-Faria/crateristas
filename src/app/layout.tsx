import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crateristas | Gourmet Restaurant Reviews",
  description: "An exclusive space for culinary enthusiasts to explore, review, and log exceptional gourmet dining experiences.",
  keywords: ["gourmet", "restaurant reviews", "fine dining", "crateristas", "threejs", "nextjs"],
  authors: [{ name: "Crateristas Culinary Club" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
