"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(next: string, formData: FormData) {
  const rawName = formData.get("user");
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const destination = next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/";
  if (!name || name.length > 100) redirect(`/login?next=${encodeURIComponent(destination)}&error=invalid`);
  (await cookies()).set("user", name, { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" });
  redirect(destination);
}
