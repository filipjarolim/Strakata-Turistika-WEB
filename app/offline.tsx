export default function Offline() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center p-8">
                <h1 className="text-4xl font-bold mb-4">You are Offline</h1>
                <p className="text-gray-600">
                    Please check your internet connection and try again.
                </p>
            </div>
        </div>
    );
}