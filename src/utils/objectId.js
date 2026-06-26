import { ObjectId } from "mongodb";
import { HttpError } from "./httpError.js";

export function toObjectId(value, label = "id") {
  if (!ObjectId.isValid(value)) {
    throw new HttpError(400, `Invalid ${label}`);
  }
  return new ObjectId(value);
}
