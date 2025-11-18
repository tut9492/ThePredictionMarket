import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAF6] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">404 - Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
        <Link
          href="/"
          className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 inline-block"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}


