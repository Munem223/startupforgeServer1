/** Escape user input before using it in a MongoDB $regex query. */
export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
