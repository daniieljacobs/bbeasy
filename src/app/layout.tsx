import Background from "@/components/Background";
import CookieBanner from "@/components/CookieBanner";
import './globals.css';
import { Roboto_Mono } from 'next/font/google';
import Script from 'next/script';

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={robotoMono.variable}>
      <body className="relative min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden font-mono">
        <Script id="google-consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
            });
          `}
        </Script>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18089399359"
          strategy="afterInteractive"
        />
        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18089399359');
          `}
        </Script>
        <Background />
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
        <CookieBanner />
      </body>
    </html>
  );
}