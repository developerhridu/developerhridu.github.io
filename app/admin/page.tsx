import { Metadata } from "next";
import AdminEditor from "@/components/admin/AdminEditor";
import { getSeo } from "@/lib/seo";
import { PAGE_CONTAINER } from "@/components/ui/PageContainer";

export const metadata: Metadata = getSeo("admin");

export default function AdminPage() {
  return (
    <div className="pt-16 md:pt-0">
      <section className="pt-5 pb-12">
        <div className={PAGE_CONTAINER}>
          <AdminEditor />
        </div>
      </section>
    </div>
  );
}
