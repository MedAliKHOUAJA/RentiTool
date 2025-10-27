import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const FRAUD_URL = process.env.FRAUD_CHECK_URL?.trim();
    if (!FRAUD_URL) {
      return new NextResponse("Missing FRAUD_CHECK_URL env", { status: 500 });
    }

    const inForm = await request.formData();
    const outForm = new FormData();

    const title = inForm.get("title");
    const description = inForm.get("description");
    const threshold = inForm.get("threshold") ?? "0.25";
    const imageFile = inForm.get("image_file");
    const imageUrl = inForm.get("image_url");

    if (!title || !description) {
      return new NextResponse("title and description are required", {
        status: 400,
      });
    }

    outForm.append("title", String(title));
    outForm.append("description", String(description));
    outForm.append("threshold", String(threshold));
    if (imageFile instanceof File) {
      outForm.append(
        "image_file",
        imageFile,
        (imageFile as any).name || "upload.jpg"
      );
    }
    if (typeof imageUrl === "string" && imageUrl) {
      // Ensure absolute URL for upstream service
      let img = imageUrl as string;
      const isAbsolute = /^https?:\/\//i.test(img);
      if (!isAbsolute) {
        const reqUrl = new URL(request.url);
        const proto = (
          request.headers.get("x-forwarded-proto") ||
          reqUrl.protocol.replace(":", "")
        ).toString();
        const host = (
          request.headers.get("x-forwarded-host") ||
          request.headers.get("host") ||
          reqUrl.host
        ).toString();
        const base = `${proto}://${host}`;
        if (!img.startsWith("/")) img = "/" + img;
        img = base + img;
      }
      outForm.append("image_url", img);
    }

    const resp = await fetch(FRAUD_URL, { method: "POST", body: outForm });
    const text = await resp.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    return new NextResponse(JSON.stringify(data), {
      status: resp.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("/api/fraud-check POST error:", err?.message || err);
    return new NextResponse("Fraud check failed", { status: 500 });
  }
}
