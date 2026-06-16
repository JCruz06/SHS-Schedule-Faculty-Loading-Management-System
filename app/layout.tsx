import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AppProvider } from '../lib/AppContext';

export const metadata: Metadata = {
  title: 'SHS Schedule & Faculty Loading Management System',
  description: 'SHS Schedule & Faculty Loading Management System for public DepEd schools',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
