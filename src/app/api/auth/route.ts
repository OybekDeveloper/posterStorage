import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// Dynamic POST to access_token
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const account = searchParams.get("account");

  if (!code || !account) {
    return new NextResponse("No code or account provided", { status: 400 });
  }

  const auth = {
    application_id: "4164",
    application_secret: "1dde40dbeaf227f70997e183eafa6685",
    code,
    account,
  };

  const formData = new URLSearchParams();
  formData.append("application_id", auth.application_id);
  formData.append("application_secret", auth.application_secret);
  formData.append("grant_type", "authorization_code");
  formData.append("redirect_uri", `https://poster-storage.vercel.app/api/auth`);
  formData.append("code", auth.code);

  try {
    const response = await fetch(
      `https://${auth.account}.joinposter.com/api/v2/auth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    const data = await response.json();
    console.log("Access token response data:", data);

    if (!data.access_token) {
      return new NextResponse("No access token in response", { status: 400 });
    }

    const res = NextResponse.redirect(s
      `https://poster-storage.vercel.app?token=${data.access_token}`
    );

    // Tokenni cookie-ga yozamiz
    res.cookies.set("posterStoreAuth", data.access_token, {
      expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 kun
    });

    return res;
  } catch (error: any) {
    console.error("Error exchanging code for access token:", error.message);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
