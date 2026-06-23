import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create default admin user
  const adminEmail = "admin@codezela.com";
  const adminPassword = "Trace8Admin2026!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`  ✓ Admin user: ${admin.email} (${admin.role})`);

  // Create default org for admin
  const orgSlug = "codezela";
  const org = await db.org.upsert({
    where: { slug: orgSlug },
    update: {},
    create: {
      name: "Codezela Technologies",
      slug: orgSlug,
      createdById: admin.id,
    },
  });

  console.log(`  ✓ Org: ${org.name} (${org.slug})`);

  // Add admin as OWNER
  await db.orgMember.upsert({
    where: { orgId_userId: { orgId: org.id, userId: admin.id } },
    update: { role: "OWNER" },
    create: { orgId: org.id, userId: admin.id, role: "OWNER" },
  });

  console.log(`  ✓ Admin is OWNER of org`);

  // Create default app settings
  const defaultSettings = [
    {
      key: "ai.enabled",
      value: { enabled: false },
    },
    {
      key: "ai.config",
      value: {
        provider: "openai",
        apiKey: "",
        apiUrl: "https://api.openai.com/v1",
        model: "gpt-4o",
      },
    },
    {
      key: "platform.name",
      value: { name: "Trace8" },
    },
  ];

  for (const setting of defaultSettings) {
    await db.appSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log(`  ✓ Default app settings created`);
  console.log("\n✅ Seed complete!");
  console.log(`   Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
