import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ótica - Gestão de Cobranças',
  description: 'Sistema administrativo para gestão de cobranças e faturamento da Ótica.',
  icons: {
    icon: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
