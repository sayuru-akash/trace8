"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.errors[0].message);
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const orgSlug = slugify(name) + "-" + Date.now().toString(36);

  const [user] = await db.$transaction([
    db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        createdOrgs: {
          create: {
            name: `${name}'s Org`,
            slug: orgSlug,
          },
        },
      },
      include: {
        createdOrgs: true,
      },
    }),
  ]);

  const org = user.createdOrgs[0];
  if (org) {
    await db.orgMember.create({
      data: {
        orgId: org.id,
        userId: user.id,
        role: "OWNER",
      },
    });
  }

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/signin" });
}
