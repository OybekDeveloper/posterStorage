import { NextRequest, NextResponse } from "next/server";

// Dynamic POST to access_token
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const account = searchParams.get("account");

  if (!code || !account) {
    return new NextResponse("No code or account provided", { status: 400 });
  }

  const auth = {
    application_id: "3771",
    application_secret: "9c5d4630518324c78ef4468c28d8effd",
    code,
    account,
  };

  const formData = new URLSearchParams();
  formData.append("application_id", auth.application_id);
  formData.append("application_secret", auth.application_secret);
  formData.append("grant_type", "authorization_code");
  formData.append("redirect_uri", `https://payment-wek9.onrender.com/auth`);
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

    const res = NextResponse.redirect(
      `https://payment-wek9.onrender.com?token=${data.access_token}`
    );

    // Tokenni cookie-ga yozamiz
    res.cookies.set("authToken", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 kun
      path: "/",
    });

    return res;
  } catch (error: any) {
    console.error("Error exchanging code for access token:", error.message);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
