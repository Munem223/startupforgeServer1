import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";
import { getDB } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";

export async function requireBetterAuthSession(req, res, next) {
  try {
    const db = getDB();

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      throw new HttpError(401, "Authentication required");
    }

    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!user) {
      throw new HttpError(401, "User not found");
    }

    if (user.isBlocked) {
      throw new HttpError(403, "User is blocked");
    }

    req.authSession = session;
    req.currentUser = user;

    next();
  } catch (err) {
    next(err);
  }
}