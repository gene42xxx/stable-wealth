import { Inter, Montserrat, IBM_Plex_Mono, Poppins } from 'next/font/google';
import "./globals.css";
import { Toaster } from 'react-hot-toast'; // Import react-hot-toast

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import Providers from "./providers";
import Header from "@/components/Header";
import Footer from '@/components/Footer';
import ClientLayout from './clientLayout';

// Load fonts with subset optimization
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ibm-plex-mono',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata = {
  title: "StableWealth - Invest Securely",
  description: "Join StableWealth for secure crypto investments with stable returns.",
  keywords: ["crypto investment", "stable wealth", "USDT", "secure investing", "crypto returns"],
  author: "StableWealth Team",
  viewport: "width=device-width, initial-scale=1.0, user-scalable=yes",
};

export default async function RootLayout({ children }) { // Make the function async
  const session = await getServerSession(authOptions); // Fetch session on the server side

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${montserrat.variable} ${ibmPlexMono.variable} ${poppins.variable} antialiased`}
      >
        <Providers session={session}> {/* Pass session to client-side Provider */}
          <ClientLayout initialSession={session}>
            {children}
          </ClientLayout>
          <Toaster /> {/* Toaster outside the conditional rendering */}
        </Providers>
      </body>
    </html>
  );
}
