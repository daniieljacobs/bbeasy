'use client'
import { useState, useEffect } from 'react'

declare function gtag(...args: unknown[]): void

export default function CookieBanner() {
    const [show, setShow] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem('cookie_consent')
        if (!stored) {
            setShow(true)
        } else if (stored === 'granted') {
            gtag('consent', 'update', {
                ad_storage: 'granted',
                ad_user_data: 'granted',
                ad_personalization: 'granted',
                analytics_storage: 'granted',
            })
        }
    }, [])

    const accept = () => {
        localStorage.setItem('cookie_consent', 'granted')
        gtag('consent', 'update', {
            ad_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'granted',
            analytics_storage: 'granted',
        })
        setShow(false)
    }

    const decline = () => {
        localStorage.setItem('cookie_consent', 'denied')
        setShow(false)
    }

    if (!show) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[200] bg-white border-t border-slate-200 font-mono">
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-900 mb-1">Cookies & Tracking</p>
                    <p className="text-xs text-slate-400 max-w-xl">
                        We use cookies for analytics and advertising to understand how users interact with the platform and to show relevant ads.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={decline}
                        className="px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border border-slate-200 hover:border-slate-400 hover:text-slate-600 transition-colors"
                    >
                        Decline
                    </button>
                    <button
                        onClick={accept}
                        className="px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-brand transition-colors"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    )
}
