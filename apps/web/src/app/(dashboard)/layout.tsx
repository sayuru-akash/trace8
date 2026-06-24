import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardLayoutClient } from "./layout-client";

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
    <DashboardLayoutClient
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }}
      org={org}
    >
      {children}
    </DashboardLayoutClient>
  );
}
