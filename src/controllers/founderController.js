import { z } from "zod";
import { getDB } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import { toObjectId } from "../utils/objectId.js";
import { success } from "../utils/response.js";
import { serializeDocument, serializeDocuments } from "../utils/serializers.js";


const startupSchema = z.object({
  startup_name: z.string().trim().min(2).max(100),
  logo: z.string().url(),
  industry: z.string().trim().min(2).max(80),
  description: z.string().trim().min(50).max(2500),
  funding_stage: z.enum(["Bootstrapped", "Pre-seed", "Seed", "Series A", "Series B+", "Not disclosed"]),
  team_size_needed: z.coerce.number().int().min(1).max(100)
});

const opportunitySchema = z.object({
  role_title: z.string().trim().min(2).max(100),
  required_skills: z.union([z.array(z.string()), z.string()]),
  work_type: z.enum(["Remote", "Hybrid", "On-site"]),
  commitment_level: z.enum(["Part-time", "Full-time", "Project-based", "Flexible"]),
  deadline: z.iso.date(),
  description: z.string().trim().min(40).max(2000)
});

const applicationStatusSchema = z.object({
  status: z.enum(["accepted", "rejected"])
});

function normalizeSkills(value) {
  const list = Array.isArray(value) ? value : value.split(",");
  const skills = [...new Set(list.map((item) => item.trim()).filter(Boolean))];
  if (!skills.length) throw new HttpError(400, "At least one required skill is needed");
  return skills.slice(0, 20);
}

function hasValidPremium(user) {
  if (!user.isPremium) return false;
  if (!user.premiumUntil) return true;
  return new Date(user.premiumUntil).getTime() > Date.now();
}

export async function getFounderOverview(req, res) {
  const db = getDB();
  const email = req.user.email;
  const [opportunities, applications, accepted, startup] = await Promise.all([
    db.collection("opportunities").countDocuments({ founder_email: email }),
    db.collection("applications").countDocuments({ founder_email: email }),
    db.collection("applications").countDocuments({ founder_email: email, status: "accepted" }),
    db.collection("startups").findOne({ founder_email: email })
  ]);

  const statusBreakdown = await db
    .collection("applications")
    .aggregate([
      { $match: { founder_email: email } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ])
    .toArray();

  return success(res, {
    totals: { opportunities, applications, acceptedMembers: accepted },
    startup: serializeDocument(startup),
    statusBreakdown: statusBreakdown.map((item) => ({ name: item._id, value: item.count }))
  });
}

export async function getMyStartup(req, res) {
  const db = getDB();
  const startup = await db.collection("startups").findOne({ founder_email: req.user.email });
  return success(res, serializeDocument(startup));
}

export async function createStartup(req, res) {
  const db = getDB();
  const values = startupSchema.parse(req.body);
  const startup = {
    ...values,
    founder_email: req.user.email,
    founder_name: req.user.name,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await db.collection("startups").insertOne(startup);
  return success(
    res,
    serializeDocument({ ...startup, _id: result.insertedId }),
    "Startup created and sent for admin approval",
    201
  );
}

export async function updateStartup(req, res) {
  const db = getDB();
  const values = startupSchema.parse(req.body);
  const result = await db.collection("startups").findOneAndUpdate(
    { _id: toObjectId(req.params.id, "startup id"), founder_email: req.user.email },
    {
      $set: {
        ...values,
        status: "pending",
        updatedAt: new Date()
      }
    },
    { returnDocument: "after" }
  );
  if (!result) throw new HttpError(404, "Startup not found");

  await db.collection("opportunities").updateMany(
    { startup_id: req.params.id, founder_email: req.user.email },
    {
      $set: {
        startup_name: values.startup_name,
        industry: values.industry,
        startup_logo: values.logo,
        startup_status: "pending",
        updatedAt: new Date()
      }
    }
  );

  return success(res, serializeDocument(result), "Startup updated and returned to pending review");
}

export async function deleteStartup(req, res) {
  const db = getDB();
  const startupId = req.params.id;
  const startup = await db.collection("startups").findOne({
    _id: toObjectId(startupId, "startup id"),
    founder_email: req.user.email
  });
  if (!startup) throw new HttpError(404, "Startup not found");

  const opportunityIds = await db
    .collection("opportunities")
    .find({ startup_id: startupId, founder_email: req.user.email }, { projection: { _id: 1 } })
    .toArray();

  await Promise.all([
    db.collection("startups").deleteOne({ _id: startup._id }),
    db.collection("opportunities").deleteMany({ startup_id: startupId, founder_email: req.user.email }),
    db.collection("applications").deleteMany({
      opportunity_id: { $in: opportunityIds.map((item) => item._id.toString()) }
    })
  ]);

  return success(res, null, "Startup and related opportunities deleted");
}

export async function createOpportunity(req, res) {
  const db = getDB();
  const values = opportunitySchema.parse(req.body);
  const startup = await db.collection("startups").findOne({ founder_email: req.user.email });
  if (!startup) throw new HttpError(400, "Create your startup profile first");
  if (new Date(values.deadline).getTime() < Date.now()) {
    throw new HttpError(400, "Application deadline must be in the future");
  }

  const existingCount = await db
    .collection("opportunities")
    .countDocuments({ founder_email: req.user.email });

  if (existingCount >= 3 && !hasValidPremium(req.user)) {
    throw new HttpError(402, "Premium founder package is required after three opportunities", {
      code: "PREMIUM_REQUIRED"
    });
  }

  const opportunity = {
    startup_id: startup._id.toString(),
    startup_name: startup.startup_name,
    startup_logo: startup.logo,
    startup_status: startup.status,
    industry: startup.industry,
    founder_email: req.user.email,
    ...values,
    required_skills: normalizeSkills(values.required_skills),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await db.collection("opportunities").insertOne(opportunity);
  return success(
    res,
    serializeDocument({ ...opportunity, _id: result.insertedId }),
    "Opportunity published successfully",
    201
  );
}

export async function getMyOpportunities(req, res) {
  const db = getDB();
  const items = await db
    .collection("opportunities")
    .find({ founder_email: req.user.email })
    .sort({ createdAt: -1 })
    .toArray();
  return success(res, serializeDocuments(items));
}

export async function updateOpportunity(req, res) {
  const db = getDB();
  const values = opportunitySchema.parse(req.body);
  if (new Date(values.deadline).getTime() < Date.now()) {
    throw new HttpError(400, "Application deadline must be in the future");
  }

  const result = await db.collection("opportunities").findOneAndUpdate(
    {
      _id: toObjectId(req.params.id, "opportunity id"),
      founder_email: req.user.email
    },
    {
      $set: {
        ...values,
        required_skills: normalizeSkills(values.required_skills),
        updatedAt: new Date()
      }
    },
    { returnDocument: "after" }
  );
  if (!result) throw new HttpError(404, "Opportunity not found");

  await db.collection("applications").updateMany(
    { opportunity_id: req.params.id },
    {
      $set: {
        opportunity_name: values.role_title,
        updatedAt: new Date()
      }
    }
  );

  return success(res, serializeDocument(result), "Opportunity updated successfully");
}

export async function deleteOpportunity(req, res) {
  const db = getDB();
  const objectId = toObjectId(req.params.id, "opportunity id");
  const result = await db.collection("opportunities").deleteOne({
    _id: objectId,
    founder_email: req.user.email
  });
  if (!result.deletedCount) throw new HttpError(404, "Opportunity not found");

  await db.collection("applications").deleteMany({ opportunity_id: req.params.id });
  return success(res, null, "Opportunity deleted successfully");
}

export async function getFounderApplications(req, res) {
  const db = getDB();
  const applications = await db
    .collection("applications")
    .find({ founder_email: req.user.email })
    .sort({ applied_at: -1 })
    .toArray();
  return success(res, serializeDocuments(applications));
}

export async function updateApplicationStatus(req, res) {
  const db = getDB();
  const { status } = applicationStatusSchema.parse(req.body);
  const application = await db.collection("applications").findOneAndUpdate(
    {
      _id: toObjectId(req.params.id, "application id"),
      founder_email: req.user.email
    },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!application) throw new HttpError(404, "Application not found");
  return success(res, serializeDocument(application), `Application ${status}`);
}
