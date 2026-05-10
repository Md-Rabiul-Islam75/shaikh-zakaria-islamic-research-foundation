import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ADMINS = [
  { phone: "01776627800", name: "Administrator", password: "amiadmin111" },
  { phone: "01552337781", name: "Administrator", password: "amiadmin111" },
];

const EDITORS = [
  { phone: "01716568029", name: "Editor", password: "amieditor123" },
];

const MADRASA_CLASSES = [
  { nameEn: "Nurani / Maktab", nameBn: "নূরানী / মক্তব", description: "Qaida, basic Quran reading" },
  { nameEn: "Nazera", nameBn: "নাজেরা", description: "Fluent Quran reading with Tajweed" },
  { nameEn: "Hifz", nameBn: "হিফজ", description: "Quran memorization" },
  { nameEn: "Ibtidaiyah", nameBn: "ইবতেদাইয়্যাহ", description: "Primary level (basic Arabic + general subjects)" },
  { nameEn: "Mutawassitah", nameBn: "মুতাওয়াস্সিতাহ", description: "Lower secondary level" },
  { nameEn: "Sanabia Ulya", nameBn: "সানাবিয়া উলয়া", description: "Secondary level (advanced Arabic, Fiqh)" },
  { nameEn: "Fazilat", nameBn: "ফাজিলত", description: "Higher secondary / intermediate Islamic studies" },
  { nameEn: "Thanviya Aamma", nameBn: "সানাবিয়া আম্মা", description: "General higher studies stage" },
  { nameEn: "Thanviya Khasa", nameBn: "সানাবিয়া খাসা", description: "Specialized higher studies" },
  { nameEn: "Fazil", nameBn: "ফাজিল", description: "Equivalent to Bachelor-level Islamic studies" },
  { nameEn: "Kamil", nameBn: "কামিল", description: "Advanced degree level" },
  { nameEn: "Tafsir Department", nameBn: "তাফসির", description: "Quran explanation specialization" },
  { nameEn: "Hadith Department", nameBn: "হাদিস", description: "Study of Hadith books" },
  { nameEn: "Dawra-e-Hadith", nameBn: "দাওরায়ে হাদিস", description: "Final and highest class (like Master's level)" },
  { nameEn: "Ifta / Takhasus", nameBn: "ইফতা / تخصص", description: "Mufti training (fatwa specialization)" },
];

async function seedAdmins() {
  for (const a of ADMINS) {
    const existing = await prisma.user.findFirst({
      where: { phone: a.phone, createdVia: "seeded", role: "admin" },
    });

    if (existing) {
      console.log(`ℹ️  Admin already exists (phone: ${a.phone}) — skipped`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(a.password, 10);
    const admin = await prisma.user.create({
      data: {
        name: a.name,
        phone: a.phone,
        password: hashedPassword,
        role: "admin",
        createdVia: "seeded",
      },
    });

    console.log(`✅ Admin created — phone: ${admin.phone}, password: ${a.password}`);
  }
}

async function seedEditors() {
  for (const e of EDITORS) {
    const existing = await prisma.user.findFirst({
      where: { phone: e.phone, createdVia: "admin_portal", role: "editor" },
    });

    if (existing) {
      console.log(`ℹ️  Editor already exists (phone: ${e.phone}) — skipped`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(e.password, 10);
    const editor = await prisma.user.create({
      data: {
        name: e.name,
        phone: e.phone,
        password: hashedPassword,
        role: "editor",
        createdVia: "admin_portal",
      },
    });

    console.log(`✅ Editor created — phone: ${editor.phone}, password: ${e.password}`);
  }
}

async function seedClasses() {
  const count = await prisma.class.count();
  if (count > 0) {
    console.log(`ℹ️  Classes already exist (${count} classes). Skipping.`);
    return;
  }

  for (let i = 0; i < MADRASA_CLASSES.length; i++) {
    const cls = MADRASA_CLASSES[i];
    await prisma.class.create({
      data: {
        nameEn: cls.nameEn,
        nameBn: cls.nameBn,
        description: cls.description,
        order: i + 1,
      },
    });
  }

  console.log(`✅ Seeded ${MADRASA_CLASSES.length} Madrasa classes`);
}

async function main() {
  console.log("🌱 Seeding database...\n");
  await seedAdmins();
  await seedEditors();
  await seedClasses();
  console.log("\n✨ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
