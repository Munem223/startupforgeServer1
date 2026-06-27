import { z } from "zod";
import { getDB } from "../config/db.js";
import { success } from "../utils/response.js";
import { serializeDocument } from "../utils/serializers.js";
const db = getDB();
const roleSchema = z.object({
  role: z.enum(["founder", "collaborator"])
});

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  image: z.string().url().or(z.literal("")).optional(),
  skills: z.union([z.array(z.string()), z.string()]).optional(),
  bio: z.string().trim().max(700).optional()
});

function publicUser(user) {
  const serialized = serializeDocument(user);
  return {
    id: serialized.id,
    _id: serialized._id,
    name: serialized.name,
    email: serialized.email,
    image: serialized.image || "",
    role: serialized.role,
    isBlocked: Boolean(serialized.isBlocked),
    skills: serialized.skills || "",
    bio: serialized.bio || "",
    isPremium: Boolean(serialized.isPremium),
    premiumUntil: serialized.premiumUntil || "",
    createdAt: serialized.createdAt,
    updatedAt: serialized.updatedAt
  };
}

export async function completeRegistration(req, res) {
  const { role } = roleSchema.parse(req.body);
  const email = req.currentUser.email;

  await db.collection("users").updateOne(
    { email },
    { $set: { role, updatedAt: new Date() } }
  );

  const user = await db.collection("users").findOne({ email });
  return success(res, publicUser(user), "Account role saved");
}

export async function getMyProfile(req, res) {
  return success(res, publicUser(req.user));
}

export async function updateMyProfile(req, res) {
  const values = profileSchema.parse(req.body);
  const update = {
    name: values.name,
    bio: values.bio ?? "",
    skills: Array.isArray(values.skills)
      ? values.skills.map((item) => item.trim()).filter(Boolean).join(", ")
      : values.skills?.trim() ?? "",
    updatedAt: new Date()
  };

  if (values.image !== undefined) update.image = values.image;

  await db.collection("users").updateOne({ email: req.user.email }, { $set: update });
  const user = await db.collection("users").findOne({ email: req.user.email });
  return success(res, publicUser(user), "Profile updated successfully");
}
