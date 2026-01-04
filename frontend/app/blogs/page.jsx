import { Suspense } from "react";
import BlogsContent from "./BlogsContent";

export default function BlogsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading blog posts...</p>
        </div>
      </div>
    }>
      <BlogsContent />
    </Suspense>
  );
}
