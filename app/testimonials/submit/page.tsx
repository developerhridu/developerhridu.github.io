import { Metadata } from "next";
import { Suspense } from "react";
import TestimonialSubmit from "@/components/sections/TestimonialSubmit";
import { getSeo } from "@/lib/seo";

export const metadata: Metadata = getSeo("testimonials-submit");

export default function TestimonialSubmitPage() {
  return (
    <div className="pt-16 md:pt-0">
      {/* The form reads ?from=/?name=/?role= via useSearchParams, which needs a
          Suspense boundary because this page is statically prerendered. */}
      <Suspense fallback={null}>
        <TestimonialSubmit />
      </Suspense>
    </div>
  );
}
