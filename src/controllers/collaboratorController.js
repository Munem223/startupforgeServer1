import { z } from "zod";
import { db } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import { toObjectId } from "../utils/objectId.js";
import { success } from "../utils/response.js";
import { serializeDocument, serializeDocuments } from "../utils/serializers.js";

const applicationSchema = z.object({
  portfolio_link: z.string().url(),
  motivation: z.string().trim().min(80).max(1500)
});

export async function applyToOpportunity(req, res) {
  const values = applicationSchema.parse(req.body);
  const opportunityId = req.params.opportunityId;
  const opportunity = await db.collection("opportunities").findOne({
    _id: toObjectId(opportunityId, "opportunity id"),
    startup_status: "approved"
  });

  if (!opportunity) throw new HttpError(404, "Opportunity not found");
  if (opportunity.founder_email === req.user.email) {
    throw new HttpError(400, "You cannot apply to your own opportunity");
  }
  if (new Date(opportunity.deadline).getTime() < Date.now()) {
    throw new HttpError(400, "The application deadline has passed");
  }

  const application = {
    opportunity_id: opportunityId,
    opportunity_name: opportunity.role_title,
    startup_name: opportunity.startup_name,
    startup_logo: opportunity.startup_logo,
    founder_email: opportunity.founder_email,
    applicant_email: req.user.email,
    applicant_name: req.user.name,
    applicant_image: req.user.image || "",
    portfolio_link: values.portfolio_link,
    motivation: values.motivation,
    status: "pending",
    applied_at: new Date(),
    updatedAt: new Date()
  };

  const result = await db.collection("applications").insertOne(application);
  return success(
    res,
    serializeDocument({ ...application, _id: result.insertedId }),
    "Application submitted successfully",
    201
  );
}

export async function getMyApplications(req, res) {
  const applications = await db
    .collection("applications")
    .find({ applicant_email: req.user.email })
    .sort({ applied_at: -1 })
    .toArray();
  return success(res, serializeDocuments(applications));
}

export async function getCollaboratorOverview(req, res) {
  const email = req.user.email;
  const [total, pending, accepted, rejected] = await Promise.all([
    db.collection("applications").countDocuments({ applicant_email: email }),
    db.collection("applications").countDocuments({ applicant_email: email, status: "pending" }),
    db.collection("applications").countDocuments({ applicant_email: email, status: "accepted" }),
    db.collection("applications").countDocuments({ applicant_email: email, status: "rejected" })
  ]);

  return success(res, {
    totals: { applications: total, pending, accepted, rejected },
    chart: [
      { name: "Pending", value: pending },
      { name: "Accepted", value: accepted },
      { name: "Rejected", value: rejected }
    ]
  });
}
