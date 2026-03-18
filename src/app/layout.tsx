// app/layout.tsx
import Background from "@/components/Background";
import './globals.css';

import { Roboto_Mono } from 'next/font/google';

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

// Add `${robotoMono.variable}` to your body className

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
        {/* Your Canvas Component */}
        <Background />

        {/* Main Content Layer */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <nav className="p-6 flex justify-between items-center border-b border-slate-200 bg-white/50 backdrop-blur-sm">
            <h1 className="font-bold text-xl tracking-tight">BB<span className="text-blue-600">EASY</span></h1>
            <div className="space-x-4 text-sm font-medium">
              <a href="/portal/dashboard" className="hover:text-blue-600 transition">My Tests</a>
              <a href="/admin/dashboard" className="px-3 py-2 bg-black text-white rounded-lg hover:bg-slate-800 transition">Admin Mode</a>
            </div>
          </nav>
          <main className="flex-1 max-w-5xl mx-auto w-full p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}