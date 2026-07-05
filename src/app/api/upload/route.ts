import cloudinary from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

// Project-specific base folder in Cloudinary so this app's images stay
// separate from any other project sharing the same account. Override with
// CLOUDINARY_UPLOAD_FOLDER in .env if you want a different name.
const BASE_FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER || "shaikh-zakaria-irc";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Optional subfolder (e.g. "students", "teachers"). Sanitized to a safe slug.
  const rawFolder = (formData.get("folder") as string | null) ?? "";
  const subFolder = rawFolder.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const folder = subFolder ? `${BASE_FOLDER}/${subFolder}` : BASE_FOLDER;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as { secure_url: string; public_id: string });
          }
        )
        .end(buffer);
    }
  );

  return NextResponse.json({
    url: result.secure_url,
    publicId: result.public_id,
  });
}
