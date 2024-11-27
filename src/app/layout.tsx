import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Image Pixelizer",
  description: "A GoLang/Wasm Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="sticky top-0 z-50 flex items-center justify-between border-b-border bg-background p-4">
            <ModeToggle />
            <Button className="p-0">
              <a
                href="https://github.com/MalteHRJ/image-pixelizer-WIP"
                className="p-4"
              >
                GitHub Repository
              </a>
            </Button>
          </header>
          <Separator />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
