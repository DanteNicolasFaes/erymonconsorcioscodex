import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Erymon Consorcios",
  description: "Administracion multi-tenant de consorcios"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <header className="border-b border-[var(--border)] bg-white">
          <nav className="mx-auto flex min-h-16 w-[min(1120px,calc(100%-32px))] items-center justify-between gap-4">
            <Link href="/" className="text-lg font-semibold">
              Erymon Consorcios
            </Link>
            <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
              <Link href="/login">Login</Link>
              <Link href="/register">Registro</Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
