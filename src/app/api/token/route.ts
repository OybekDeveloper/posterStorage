// app/api/poster-auth/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const application_id = "4164";
  const application_secret = "1dde40dbeaf227f70997e183eafa6685";
  const verifyString = `${application_id}:${application_secret}:${code}`;
  const verify = crypto.createHash("md5").update(verifyString).digest("hex");

  const formBody = new URLSearchParams({
    application_id: "4164",
    application_secret: "1dde40dbeaf227f70997e183eafa6685",
    code,
    verify,
  });

  const authRes = await fetch("https://joinposter.com/api/v2/auth/manage", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody.toString(),
  });

  const authData = await authRes.json();
  console.log({ authData });

  if (!authData.access_token) {
    return NextResponse.json(
      {
        error: "Could not get token",
        message: authData.message || "Unknown error",
      },
      { status: 401 }
    );
  }
  return NextResponse.json({ token: authData?.access_token, status: "ok" });
}
