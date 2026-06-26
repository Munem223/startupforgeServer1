import jwt from "jsonwebtoken";
import { env, isProduction } from "../config/env.js";
import { success } from "../utils/response.js";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction || env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export async function issueAccessToken(req, res) {
  const user = req.currentUser;
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN, issuer: "startupforge-api" }
  );

  res.cookie(env.JWT_COOKIE_NAME, token, cookieOptions);
  return success(
    res,
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        isPremium: user.isPremium,
        premiumUntil: user.premiumUntil
      }
    },
    "Secure access token issued"
  );
}

export function clearAccessToken(req, res) {
  res.clearCookie(env.JWT_COOKIE_NAME, {
    httpOnly: true,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: "/"
  });
  return success(res, null, "Access token cleared");
}
