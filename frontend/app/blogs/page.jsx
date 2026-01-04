// frontend/app/blogs/page.jsx
"use client"; // this makes the page a client component
export const dynamic = "force-dynamic"; // force Next.js to skip prerendering

import BlogsContent from "./BlogsContent";

export default function BlogsPage() {
  return <BlogsContent />;
}
