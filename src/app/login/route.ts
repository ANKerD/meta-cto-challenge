import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("user")?.trim();
  if (!username || username.length > 100) {
    return new Response("Provide a user name of up to 100 characters.", { status: 400 });
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("user", username, { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}
