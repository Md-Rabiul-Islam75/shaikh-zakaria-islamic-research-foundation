import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ADMIN_PHONE = "01776627800";
const ADMIN_NAME = "Administrator";
const ADMIN_PASSWORD = "amiadmin111";

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

async function seedAdmin() {
  const existing = await prisma.user.findUnique({
    where: { phone: ADMIN_PHONE },
  });

  if (existing) {
    console.log(`ℹ️  Admin account already exists (phone: ${ADMIN_PHONE})`);
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      phone: ADMIN_PHONE,
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log("✅ Admin account created!");
  console.log(`   Phone:    ${admin.phone}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
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
  await seedAdmin();
  await seedClasses();
  console.log("\n✨ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
