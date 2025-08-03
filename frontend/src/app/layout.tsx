import type { Metadata } from "next";

import { Roboto } from 'next/font/google';
import './globals.css';
import ContextProvider from '@/context'

const roboto = Roboto({
  subsets: ['latin'], // ou ['latin-ext']
  weight: ['300', '400', '500', '700'], // poids que tu veux
  display: 'swap',
})


export const metadata: Metadata = {
  title: 'Position Order',
  description: 'Create stop loss order on your position',
  icons: {
    icon: '/logo.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className={roboto.className}>
      <body>
        <ContextProvider>{children}</ContextProvider>
      </body>
    </html>
  );
}
