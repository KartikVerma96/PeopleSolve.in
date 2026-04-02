import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("demo", 10);

  // Demo user
  const demo = await prisma.user.upsert({
    where: { email: "demo@peoplesolve.dev" },
    create: {
      email: "demo@peoplesolve.dev",
      name: "Demo Student",
      passwordHash: hash,
      karma: 42,
      isGuest: false,
    },
    update: { passwordHash: hash, name: "Demo Student", karma: 42 },
  });

  // Seed users
  const seedUsers = [
    { email: "aditya@seed.dev", name: "Aditya K." },
    { email: "priya@seed.dev", name: "Priya S." },
    { email: "rahul@seed.dev", name: "Rahul M." },
    { email: "neha@seed.dev", name: "Neha R." },
    { email: "vikram@seed.dev", name: "Vikram T." },
    { email: "ananya@seed.dev", name: "Ananya P." },
    { email: "siddharth@seed.dev", name: "Siddharth L." },
    { email: "ishita@seed.dev", name: "Ishita D." },
    { email: "rohan@seed.dev", name: "Rohan G." },
    { email: "meera@seed.dev", name: "Meera J." },
  ];

  const users = await Promise.all(
    seedUsers.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        create: {
          email: u.email,
          name: u.name,
          passwordHash: hash,
          karma: Math.floor(Math.random() * 80),
          isGuest: false,
        },
        update: { name: u.name },
      }),
    ),
  );

  // Clear existing data for clean re-seed
  await prisma.message.deleteMany();
  await prisma.threadMember.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.doubt.deleteMany();

  const doubts = [
    // SSC
    {
      authorId: users[6]!.id,
      exam: "SSC CGL",
      subject: "Reasoning",
      title: "Circular seating — who faces centre with 7 people?",
      description:
        "Fixed positions with 2 constraints. I draw the circle but take 4 mins — is there a faster method without drawing? Need a shortcut for SSC CGL Tier-1.",
      urgent: false,
      viewerCount: 11,
      helperCount: 2,
    },
    {
      authorId: users[8]!.id,
      exam: "SSC CHSL",
      subject: "Quantitative Aptitude",
      title: "Pipe and cistern — 3 pipes filling at different rates",
      description:
        "Pipe A fills in 12 hrs, B in 15 hrs, C empties in 20 hrs. All three open, how long to fill? My LCM method gives wrong answer. What am I missing?",
      urgent: false,
      viewerCount: 8,
      helperCount: 1,
    },
    // Bank
    {
      authorId: users[5]!.id,
      exam: "IBPS PO",
      subject: "Data Interpretation",
      title: "Caselet DI — missing data approach for Mains",
      description:
        "In IBPS PO Mains, caselets don't give all values directly. How do you set up equations from paragraph data efficiently? Any shortcut for percentage-based caselets?",
      urgent: true,
      viewerCount: 19,
      helperCount: 3,
    },
    {
      authorId: users[9]!.id,
      exam: "SBI Clerk",
      subject: "Banking Awareness",
      title: "Difference between NEFT, RTGS, and IMPS — always confused",
      description:
        "I keep mixing up the timing, limits, and settlement types. Is there a clean comparison table? Also, which one is real-time vs batch?",
      urgent: false,
      viewerCount: 25,
      helperCount: 4,
    },
    // Railway
    {
      authorId: users[3]!.id,
      exam: "RRB NTPC",
      subject: "General Awareness",
      title: "Important dams and rivers — quick revision list?",
      description:
        "RRB NTPC asks 2-3 questions on dams every year. Need a compact list of major dams, their rivers, and states. Especially Bhakra Nangal, Tehri, Hirakud confusion.",
      urgent: false,
      viewerCount: 15,
      helperCount: 2,
    },
    {
      authorId: users[7]!.id,
      exam: "RRB Group D",
      subject: "Mathematics",
      title: "Profit and loss — successive discount shortcut?",
      description:
        "Two successive discounts of 20% and 10% on Rs 500. I'm getting different answers with different methods. Is there a single formula for successive discounts?",
      urgent: false,
      viewerCount: 12,
      helperCount: 1,
    },
    // IIT-JEE
    {
      authorId: users[0]!.id,
      exam: "JEE Main",
      subject: "Physics",
      title: "Rolling without slipping — which frame do I fix?",
      description:
        "Cylinder on a rough plank accelerating right. I keep mixing up whether friction does work on the cylinder in the ground frame vs plank frame. Can someone walk me through the energy approach?",
      urgent: true,
      viewerCount: 14,
      helperCount: 2,
    },
    {
      authorId: users[4]!.id,
      exam: "JEE Advanced",
      subject: "Chemistry",
      title: "SN1 vs SN2 in polar protic solvents — quick rule?",
      description:
        "Primary substrate + methanol — I get SN2 in notes but questions push SN1. What am I missing? Is it about the leaving group or the nucleophile?",
      urgent: true,
      viewerCount: 27,
      helperCount: 5,
    },
    // NEET
    {
      authorId: users[1]!.id,
      exam: "NEET UG",
      subject: "Biology (Zoology)",
      title: "Action potential vs resting potential — exam trap?",
      description:
        "They always ask about Na+/K+ pump vs channels. Need a clean 3-line distinction for MCQs. Also confused about the refractory period — absolute vs relative.",
      urgent: false,
      viewerCount: 31,
      helperCount: 4,
    },
    {
      authorId: users[7]!.id,
      exam: "NEET UG",
      subject: "Chemistry",
      title: "IUPAC — longest chain with double bond + substituent priority",
      description:
        "Parent chain picks wrong when ether is far but alkene is closer. Priority rules conflict in one example. How do I decide which chain is the parent?",
      urgent: false,
      viewerCount: 18,
      helperCount: 2,
    },
    // UPSC
    {
      authorId: users[2]!.id,
      exam: "UPSC CSE Prelims",
      subject: "Indian Polity",
      title: "Basic structure doctrine — which cases to quote?",
      description:
        "Kesavananda is obvious; do examiners expect Minerva Mills / I.R. Coelho nuance in 150 words? What about the 42nd Amendment connection?",
      urgent: false,
      viewerCount: 22,
      helperCount: 1,
    },
    {
      authorId: users[9]!.id,
      exam: "UPSC CSE Mains",
      subject: "Indian Economy",
      title: "Fiscal deficit vs revenue deficit vs primary deficit",
      description:
        "I understand the formulas but struggle with the conceptual difference in UPSC answer writing. How do I frame a 150-word answer that covers all three without being repetitive?",
      urgent: false,
      viewerCount: 16,
      helperCount: 2,
    },
  ];

  for (const d of doubts) {
    await prisma.doubt.create({ data: d });
  }

  console.log(`Seeded: 1 demo user, ${users.length} seed users, ${doubts.length} doubts`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
