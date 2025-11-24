import "~/styles/globals.css";

// Temporarily disabled due to network restrictions in sandbox
// import { Inter } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { ClerkProvider } from "@clerk/nextjs";
import { EventFormProvider } from "./_components/contexts/event-form-context";
import { GuestFormProvider } from "./_components/contexts/guest-form-context";
import { Toaster } from "~/components/ui/toaster";
import { type Viewport } from "next/types";

// const inter = Inter({
//   subsets: ["latin"],
//   variable: "--font-sans",
// });

export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
};

export const metadata = {
  title: "Not The Knot",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="font-sans">
          <TRPCReactProvider>
            <EventFormProvider>
              <GuestFormProvider>
                {children}
                <Toaster />
              </GuestFormProvider>
            </EventFormProvider>
          </TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
