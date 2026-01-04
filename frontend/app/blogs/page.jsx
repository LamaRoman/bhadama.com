import { Suspense } from "react";
import BlogsContent from "./BlogsContent";

export default function BlogsPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Blog Posts</h2>
            <p className="text-gray-600">Discover amazing stories and tips from our community</p>
          </div>
        </div>
      }
    >
      <BlogsContent />
    </Suspense>
  );
}
