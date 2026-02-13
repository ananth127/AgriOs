import { Link } from '@/navigation';
import { MapPinOff, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
            <div className="bg-slate-800/50 p-6 rounded-full border border-white/10">
                <MapPinOff className="w-12 h-12 text-slate-400" />
            </div>

            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
                <p className="text-slate-400 max-w-md mx-auto">
                    We couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
                </p>
            </div>

            <Link
                href="/"
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-xl transition-all border border-white/10"
            >
                <Home className="w-4 h-4" />
                Return to Dashboard
            </Link>
        </div>
    );
}
