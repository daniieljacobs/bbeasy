export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-6">
            <div className="w-full max-w-md bg-white/80 backdrop-blur-lg p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl">
                {children}
            </div>
        </div>
    );
}