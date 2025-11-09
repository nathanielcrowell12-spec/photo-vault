// src/app/directory/page.tsx
import Link from 'next/link'

export default function DirectoryPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
            PhotoVault
          </Link>
          <div className="flex gap-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link href="/directory/photographers" className="text-blue-600 hover:text-blue-700 font-medium">
              Photographers
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-center">Photo Location Directory</h1>
        <p className="text-center mt-4 text-lg text-gray-600">
          Find the perfect spot for your next shoot.
        </p>
        <p className="text-center mt-2 text-sm text-gray-500">
          30 curated Madison-area locations with insider tips
        </p>
        {/* Search bar and featured cities will be added here */}
      </div>
    </div>
  );
}
