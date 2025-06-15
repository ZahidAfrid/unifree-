import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Link from 'next/link';
import { FaHome, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';

export default function Custom404() {
  const router = useRouter();

  useEffect(() => {
    // If user is trying to access dashboard routes, redirect appropriately
    const path = router.asPath;
    
    // Add a small delay to prevent immediate redirect on legitimate 404s
    const timer = setTimeout(() => {
      if (path.includes('/dashboard') || path.includes('/client-dashboard')) {
        // Try to redirect to the appropriate dashboard based on the URL
        if (path.includes('/client-dashboard')) {
          router.replace('/client-dashboard');
        } else if (path.includes('/dashboard')) {
          router.replace('/dashboard');
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <FaExclamationTriangle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          <p className="text-gray-600">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.back()}
            className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Go Back
          </button>
          
          <Link href="/">
            <button className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:shadow-lg transition-all duration-200">
              <FaHome className="mr-2" />
              Go to Homepage
            </button>
          </Link>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">Quick Links:</p>
            <div className="space-y-2">
              <Link href="/dashboard" className="block text-sm text-indigo-600 hover:text-indigo-700">
                Freelancer Dashboard
              </Link>
              <Link href="/client-dashboard" className="block text-sm text-indigo-600 hover:text-indigo-700">
                Client Dashboard
              </Link>
              <Link href="/explore" className="block text-sm text-indigo-600 hover:text-indigo-700">
                Explore Projects
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 