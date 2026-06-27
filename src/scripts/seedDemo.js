import "dotenv/config";
import { connectDatabase, getDB, mongoClient } from "../config/db.js";

const startups = [
  {
    startup_name: "NovaGrid AI",
    logo: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=300&q=80",
    industry: "Artificial Intelligence",
    description: "NovaGrid builds practical AI workflow tools that help small teams automate research, operations, and customer support without complex setup.",
    funding_stage: "Seed",
    founder_email: "maya@novagrid.demo",
    founder_name: "Maya Rahman",
    team_size_needed: 5,
    status: "approved"
  },
  {
    startup_name: "GreenLoop",
    logo: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=300&q=80",
    industry: "Climate Tech",
    description: "GreenLoop connects local businesses with circular supply partners to reduce packaging waste and track measurable environmental impact.",
    funding_stage: "Pre-seed",
    founder_email: "leo@greenloop.demo",
    founder_name: "Leo Martins",
    team_size_needed: 4,
    status: "approved"
  },
  {
    startup_name: "CareBridge",
    logo: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=300&q=80",
    industry: "Health Tech",
    description: "CareBridge gives clinics a secure, friendly coordination workspace for appointments, follow-ups, and remote care communication.",
    funding_stage: "Seed",
    founder_email: "sara@carebridge.demo",
    founder_name: "Sara Kim",
    team_size_needed: 6,
    status: "approved"
  },
  {
    startup_name: "SkillSpring",
    logo: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=300&q=80",
    industry: "EdTech",
    description: "SkillSpring creates mentor-led micro-learning journeys that help early-career professionals build portfolio-ready skills through real projects.",
    funding_stage: "Bootstrapped",
    founder_email: "amir@skillspring.demo",
    founder_name: "Amir Hasan",
    team_size_needed: 3,
    status: "approved"
  },
  {
    startup_name: "FinPilot",
    logo: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=300&q=80",
    industry: "FinTech",
    description: "FinPilot helps independent businesses forecast cash flow, understand spending patterns, and make confident financial decisions.",
    funding_stage: "Series A",
    founder_email: "nora@finpilot.demo",
    founder_name: "Nora Ahmed",
    team_size_needed: 7,
    status: "approved"
  },
  {
    startup_name: "RemoteNest",
    logo: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=300&q=80",
    industry: "Future of Work",
    description: "RemoteNest is a collaboration and culture platform for distributed startup teams, combining rituals, recognition, and lightweight analytics.",
    funding_stage: "Pre-seed",
    founder_email: "jon@remotenest.demo",
    founder_name: "Jon Bell",
    team_size_needed: 4,
    status: "approved"
  }
];

const roleTemplates = [
  ["Frontend Engineer", ["React", "JavaScript", "REST API"], "Remote", "Part-time"],
  ["Product Designer", ["Figma", "UX Research", "Design Systems"], "Hybrid", "Project-based"],
  ["Growth Marketer", ["SEO", "Content Strategy", "Analytics"], "Remote", "Flexible"],
  ["Backend Engineer", ["Node.js", "MongoDB", "API Design"], "Remote", "Full-time"]
];

try {
  await connectDatabase();
  const db = getDB();
  await db.collection("applications").deleteMany({ demo: true });
  await db.collection("opportunities").deleteMany({ demo: true });
  await db.collection("startups").deleteMany({ founder_email: { $regex: "\\.demo$" } });

  for (let index = 0; index < startups.length; index += 1) {
    const startup = { ...startups[index], createdAt: new Date(Date.now() - index * 86400000), updatedAt: new Date() };
    const result = await db.collection("startups").insertOne(startup);

    for (let roleIndex = 0; roleIndex < 2; roleIndex += 1) {
      const template = roleTemplates[(index + roleIndex) % roleTemplates.length];
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 14 + index * 2 + roleIndex * 4);
      await db.collection("opportunities").insertOne({
        startup_id: result.insertedId.toString(),
        startup_name: startup.startup_name,
        startup_logo: startup.logo,
        startup_status: "approved",
        industry: startup.industry,
        founder_email: startup.founder_email,
        role_title: template[0],
        required_skills: template[1],
        work_type: template[2],
        commitment_level: template[3],
        deadline: deadline.toISOString().slice(0, 10),
        description: `Join ${startup.startup_name} and take ownership of meaningful product work. You will collaborate directly with the founding team, ship real outcomes, and help shape an early-stage company.`,
        demo: true,
        createdAt: new Date(Date.now() - (index * 2 + roleIndex) * 3600000),
        updatedAt: new Date()
      });
    }
  }

  console.log("✅ Demo startups and opportunities created");
} catch (error) {
  console.error("❌ Demo seed failed:", error);
  process.exitCode = 1;
} finally {
  await mongoClient.close();
}
