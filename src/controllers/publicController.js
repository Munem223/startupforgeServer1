import { getDB } from "../config/db.js";
import { toObjectId } from "../utils/objectId.js";
import { success } from "../utils/response.js";
import { serializeDocument, serializeDocuments } from "../utils/serializers.js";
import { HttpError } from "../utils/httpError.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);



export async function getFeaturedStartups(req, res) {
  const db = getDB();
  const startups = await db
    .collection("startups")
    .find({ status: "approved" })
    .sort({ createdAt: -1 })
    .limit(6)
    .toArray();
  return success(res, serializeDocuments(startups));
}

export async function browseStartups(req, res) {
  const page = clamp(Number(req.query.page) || 1, 1, 100000);
  const limit = clamp(Number(req.query.limit) || 9, 1, 24);
  const search = String(req.query.search || "").trim();
  const safeSearch = escapeRegex(search);
  const query = { status: "approved" };

  if (search) {
    query.$or = [
      { startup_name: { $regex: safeSearch, $options: "i" } },
      { industry: { $regex: safeSearch, $options: "i" } },
      { founder_name: { $regex: safeSearch, $options: "i" } }
    ];
  }

  const [items, total] = await Promise.all([
    db.collection("startups").find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    db.collection("startups").countDocuments(query)
  ]);

  return success(res, {
    items: serializeDocuments(items),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  });
}

export async function getStartupDetails(req, res) {
  const startup = await db.collection("startups").findOne({
    _id: toObjectId(req.params.id, "startup id"),
    status: "approved"
  });
  if (!startup) throw new HttpError(404, "Startup not found");
  const db = getDB();
  const opportunities = await db
    .collection("opportunities")
    .find({ startup_id: startup._id.toString() })
    .sort({ createdAt: -1 })
    .toArray();

  return success(res, {
    startup: serializeDocument(startup),
    opportunities: serializeDocuments(opportunities)
  });
}

export async function getFeaturedOpportunities(req, res) {
  const db = getDB();
  const opportunities = await db
    .collection("opportunities")
    .find({ startup_status: "approved", deadline: { $gte: new Date().toISOString().slice(0, 10) } })
    .sort({ createdAt: -1 })
    .limit(6)
    .toArray();
  return success(res, serializeDocuments(opportunities));
}

export async function browseOpportunities(req, res) {
  const page = clamp(Number(req.query.page) || 1, 1, 100000);
  const limit = clamp(Number(req.query.limit) || 9, 1, 24);
  const search = String(req.query.search || "").trim();
  const safeSearch = escapeRegex(search);
  const workTypes = String(req.query.workType || "").split(",").map((v) => v.trim()).filter(Boolean);
  const industries = String(req.query.industry || "").split(",").map((v) => v.trim()).filter(Boolean);

  const query = { startup_status: "approved" };

  // Assignment challenge: MongoDB $regex search by role title and required skills.
  if (search) {
    query.$or = [
      { role_title: { $regex: safeSearch, $options: "i" } },
      { required_skills: { $regex: safeSearch, $options: "i" } }
    ];
  }

  // Assignment challenge: MongoDB $in filters for work type and industry.
  if (workTypes.length) query.work_type = { $in: workTypes };
  if (industries.length) query.industry = { $in: industries };

  const [items, total, workTypeOptions, industryOptions] = await Promise.all([
    db.collection("opportunities").find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    db.collection("opportunities").countDocuments(query),
    db.collection("opportunities").distinct("work_type", { startup_status: "approved" }),
    db.collection("opportunities").distinct("industry", { startup_status: "approved" })
  ]);

  return success(res, {
    items: serializeDocuments(items),
    filters: { workTypes: workTypeOptions.sort(), industries: industryOptions.sort() },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  });
}

export async function getOpportunityDetails(req, res) {
  const db = getDB();
  const opportunity = await db.collection("opportunities").findOne({
    _id: toObjectId(req.params.id, "opportunity id"),
    startup_status: "approved"
  });
  if (!opportunity) throw new HttpError(404, "Opportunity not found");
  return success(res, serializeDocument(opportunity));
}

export async function getPublicStatistics(req, res) {
  const db = getDB();
  const [startups, opportunities, members, accepted] = await Promise.all([
    db.collection("startups").countDocuments({ status: "approved" }),
    db.collection("opportunities").countDocuments({ startup_status: "approved" }),
    db.collection("users").countDocuments({ isBlocked: { $ne: true } }),
    db.collection("applications").countDocuments({ status: "accepted" })
  ]);

  return success(res, { startups, opportunities, members, successfulMatches: accepted });
}
