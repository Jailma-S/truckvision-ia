import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/clients";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const failed = (message: string) =>
    NextResponse.redirect(new URL(`/login?erro=${encodeURIComponent(message)}`, request.url));

  const linkError = params.get("error_description") ?? params.get("error");
  if (linkError) return failed(linkError);

  const code = params.get("code");
  if (!code) return failed("link sem código de acesso");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return failed(error.message);

  return NextResponse.redirect(new URL("/", request.url));
}
