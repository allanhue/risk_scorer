import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/navbar";
import BackendStatusBanner from "@/components/back_status_banner";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body suppressHydrationWarning>
          <BackendStatusBanner />
          <Navbar />
          <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}