export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function respond(res, payload, status = 200) {
  res.status(status).json(payload);
}

export function fail(res, message, status = 400) {
  respond(res, { success: false, message }, status);
}

export function input(req) {
  return req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
}

export function handleDatabaseError(res, error) {
  if (error?.code === "23505") {
    const detail = String(error.detail || "");
    if (detail.includes("email")) return fail(res, "Email sudah terdaftar.", 409);
    if (detail.includes("username")) return fail(res, "Username sudah terdaftar.", 409);
    if (detail.includes("nip")) return fail(res, "NIP sudah terdaftar.", 409);
    if (detail.includes("kode")) return fail(res, "Kode sudah digunakan.", 409);
    if (detail.includes("isbn")) return fail(res, "ISBN sudah digunakan.", 409);
    return fail(res, "Data sudah terdaftar.", 409);
  }
  if (error?.code === "23503") {
    return fail(res, "Data masih digunakan oleh data lain.", 409);
  }
  if (error?.code === "22P02") {
    return fail(res, "Format data tidak valid.", 422);
  }
  console.error(error);
  return fail(res, "Terjadi kesalahan pada server.", 500);
}

export function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
