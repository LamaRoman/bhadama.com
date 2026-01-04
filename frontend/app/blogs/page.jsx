import { Suspense } from "react";
import BlogsContent from "./BlogsContent";

export default function BlogsPage() {
  return (
    <Suspense fallback={<div>Loading blogs...</div>}>
      <BlogsContent />
    </Suspense>
  );
}
