import { Metadata } from "next";
import AdminEditor from "@/components/admin/AdminEditor";
import { getSeo } from "@/lib/seo";

export const metadata: Metadata = getSeo("admin");

export default function AdminPage() {
  return (
    <div className="pt-16 md:pt-0">
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <AdminEditor />
        </div>
      </section>
    </div>
  );
}
