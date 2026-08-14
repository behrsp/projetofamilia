import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'Grupo ABADÁ Capoeira | Acervo & Gestão',
  description: 'Sistema oficial do Grupo ABADÁ Capoeira para cadastro de alunos, graduações, letras de músicas, tutoriais em vídeo de instrumentos, eventos e mensageiro suporte.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} dark`}>
      <head>
        <link rel="icon" href="/icon.png?v=2" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/icon.png?v=2" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png?v=2" />
      </head>
      <body className="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
