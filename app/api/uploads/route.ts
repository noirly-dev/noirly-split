import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  ApiError,
  jsonError,
  jsonOk,
  requireSplitSession,
} from "@/src/server/api/http";
import { canWriteToR2, uploadBuffer } from "@/src/server/storage/r2";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    await requireSplitSession();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "invalid_request", "file is required");
    }
    if (!ALLOWED.has(file.type)) {
      throw new ApiError(400, "invalid_request", "Only image uploads are allowed");
    }
    if (file.size > MAX_BYTES) {
      throw new ApiError(400, "invalid_request", "File must be under 5MB");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";
    const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

    if (canWriteToR2()) {
      const uploaded = await uploadBuffer(
        buffer,
        name,
        file.type,
        "split/receipts",
      );
      return jsonOk({ url: uploaded.publicUrl, key: uploaded.key }, 201);
    }

    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), buffer);

    const origin = new URL(request.url).origin;
    return jsonOk({ url: `${origin}/uploads/${name}` }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
