import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Poster Storage",
  description: "Poster Storage - Data Export",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script id="hide-spinner" strategy="afterInteractive">
          {`
            window.addEventListener("load", function () {
              if (typeof top !== "undefined" && top) {
                top.postMessage({ hideSpinner: true }, "*");
              }
            });
          `}
        </Script>
        <Toaster />
        {children}
      </body>
    </html>
  );
}
