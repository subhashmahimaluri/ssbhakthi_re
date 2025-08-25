import { ReactNode } from 'react';
import AuthProvider from './(admin)/providers/AuthProvider';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

export const metadata = {
  title: 'SSBhakthi',
  description: 'Multilingual spiritual platform',
};
