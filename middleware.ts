import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// JoinPoster redirect URL
const POSTER_AUTH_URL = `https://joinposter.com/api/auth?application_id=4164&redirect_uri=https://poster-storage.vercel.app/api/auth&response_type=code`;

export function middleware(request: NextRequest) {
  const token = request.cookies.get("authToken")?.value;

  // Agar token bo'lmasa — redirect qilamiz
  if (!token) {
    return NextResponse.redirect(POSTER_AUTH_URL);
  }

  // Aks holda sahifani ko'rsatamiz
  return NextResponse.next();
}
