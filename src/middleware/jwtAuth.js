import jwt from "jsonwebtoken";
import { getDB } from "../config/db.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";


export async function requireJwt(req, res, next) {
  const db = getDB();
  try {
    const token = req.cookies?.[env.JWT_COOKIE_NAME];
    if (!token) throw new HttpError(401, "Access token missing");

    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await db.collection("users").findOne({ email: payload.email });

    if (!user) throw new HttpError(401, "User account not found");
    if (user.isBlocked) throw new HttpError(403, "Your account has been blocked");

    req.jwt = payload;
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(new HttpError(401, "Invalid or expired access token"));
    }
    next(error);
  }
}

export const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new HttpError(403, "You do not have permission to perform this action"));
  }
  next();
};
