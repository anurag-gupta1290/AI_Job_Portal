import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-8 font-sans">
      <p className="font-display text-8xl font-bold text-brand-200 mb-4">404</p>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-6 text-sm max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
