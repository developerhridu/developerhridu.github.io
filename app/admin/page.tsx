import { Metadata } from "next";
import AdminEditor from "@/components/admin/AdminEditor";

export const metadata: Metadata = {
  title: "Admin | Content Editor",
  robots: { index: false, follow: false },
};

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
