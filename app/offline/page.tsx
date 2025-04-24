import { ArrowLeft, WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <WifiOff className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">You&apos;re offline</h1>
          <p className="text-gray-600 mb-6">
            Please check your internet connection and try again
          </p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go back to homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
} 