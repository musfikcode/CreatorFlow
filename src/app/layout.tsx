import { Provider } from "jotai";
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { TRPCReactProvider } from "./api/trpc/client";

import "./globals.css";

export const metadata: Metadata = {
  title: "Creambon | Automation Toolkit",
  description: "Automate your daily tasks with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TRPCReactProvider>
          <NuqsAdapter>
            <Provider>{children}</Provider>
            <Toaster />
          </NuqsAdapter>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
