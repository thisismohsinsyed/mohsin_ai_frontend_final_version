import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

const sanitize = (value) => (typeof value === "string" ? value.trim() : undefined);

export async function POST(request) {
  try {
    const body = await request.json();
    const email = sanitize(body?.email);
    const password = body?.password;
    const firstName = sanitize(body?.firstName) || undefined;
    const lastName = sanitize(body?.lastName) || undefined;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await clerkClient.users.createUser({
      email_address: [email],
      password,
      first_name: firstName,
      last_name: lastName,
      skip_email_verification: true,
    });

    return NextResponse.json({ userId: user.id, email });
  } catch (error) {
    const clerkError = error?.errors?.[0];
    const message = clerkError?.long_message || clerkError?.message || "Unable to create account.";
    return NextResponse.json({ error: message }, { status: clerkError?.code === "form_identifier_exists" ? 409 : 400 });
  }
}
