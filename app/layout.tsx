import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/nav_bar";
import BackendStatusBanner from "@/components/status_banner";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl="/">
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