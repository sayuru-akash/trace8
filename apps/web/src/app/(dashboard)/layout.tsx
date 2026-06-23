import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const orgMember = await db.orgMember.findFirst({
    where: { userId: session.user.id },
    include: { org: true },
  });

  const org = orgMember?.org ?? null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        user={{
          name: session.user.name,
          email: session.user.email,
        }}
        org={org}
      />
      <DashboardShell>{children}</DashboardShell>
    </div>
  );
}
