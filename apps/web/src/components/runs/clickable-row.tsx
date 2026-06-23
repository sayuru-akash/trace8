"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";

export function ClickableRow({
  href,
  children,
  ...props
}: {
  href: string;
  children: React.ReactNode;
} & React.ComponentProps<typeof TableRow>) {
  const router = useRouter();

  return (
    <TableRow
      onClick={() => router.push(href)}
      className="cursor-pointer"
      {...props}
    >
      {children}
    </TableRow>
  );
}
