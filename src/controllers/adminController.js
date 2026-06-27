import { z } from "zod";
import { getDB } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import { toObjectId } from "../utils/objectId.js";
import { success } from "../utils/response.js";
import { serializeDocuments, serializeDocument } from "../utils/serializers.js";

const blockSchema = z.object({ isBlocked: z.boolean() });
const startupStatusSchema = z.object({ status: z.enum(["approved", "removed"]) });


export async function getAdminOverview(req, res) {
  const db = getDB();
  const [users, startups, opportunities, revenueAgg, roleStats, monthlyPayments] = await Promise.all([
    db.collection("users").countDocuments(),
    db.collection("startups").countDocuments(),
    db.collection("opportunities").countDocuments(),
    db.collection("payments").aggregate([
      { $match: { payment_status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).toArray(),
    db.collection("users").aggregate([
      { $group: { _id: "$role", value: { $sum: 1 } } }
    ]).toArray(),
    db.collection("payments").aggregate([
      { $match: { payment_status: "paid" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$paid_at" } },
          value: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]).toArray()
  ]);

  return success(res, {
    totals: {
      users,
      startups,
      opportunities,
      revenue: revenueAgg[0]?.total || 0
    },
    roleStats: roleStats.map((item) => ({ name: item._id || "unknown", value: item.value })),
    monthlyPayments: monthlyPayments.map((item) => ({ name: item._id, value: item.value }))
  });
}

export async function getUsers(req, res) {
  const db = getDB();
  const users = await db
    .collection("users")
    .find({}, { projection: { email: 1, name: 1, image: 1, role: 1, isBlocked: 1, isPremium: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .toArray();
  return success(res, serializeDocuments(users));
}

export async function setUserBlocked(req, res) {
  const { isBlocked } = blockSchema.parse(req.body);
  const userId = req.params.id;
  if (req.user.id === userId) throw new HttpError(400, "You cannot block your own admin account");

  const user = await db.collection("users").findOneAndUpdate(
    { id: userId },
    { $set: { isBlocked, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!user) throw new HttpError(404, "User not found");

  if (isBlocked) await db.collection("sessions").deleteMany({ userId });
  return success(res, serializeDocument(user), isBlocked ? "User blocked" : "User unblocked");
}

export async function getStartupsForAdmin(req, res) {
  const startups = await db.collection("startups").find().sort({ createdAt: -1 }).toArray();
  return success(res, serializeDocuments(startups));
}

export async function setStartupStatus(req, res) {
  const { status } = startupStatusSchema.parse(req.body);
  const startupId = req.params.id;
  const startup = await db.collection("startups").findOneAndUpdate(
    { _id: toObjectId(startupId, "startup id") },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!startup) throw new HttpError(404, "Startup not found");

  await db.collection("opportunities").updateMany(
    { startup_id: startupId },
    { $set: { startup_status: status, updatedAt: new Date() } }
  );

  return success(res, serializeDocument(startup), `Startup ${status}`);
}

export async function getTransactions(req, res) {
  const payments = await db.collection("payments").find().sort({ paid_at: -1 }).toArray();
  return success(res, serializeDocuments(payments));
}
