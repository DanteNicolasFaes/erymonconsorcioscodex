import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

type Profile = {
  global_role: "superadmin" | null;
  status: "pending" | "active" | "rejected" | "disabled";
};

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function isPrivatePath(pathname: string) {
  return pathname === "/buildings" || pathname.startsWith("/superadmin");
}

function isAuthPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password"
  );
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user) {
    if (isPrivatePath(pathname)) {
      return redirectTo(request, "/login");
    }

    return response;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("global_role,status")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (profileError) {
    if (isPrivatePath(pathname)) {
      return redirectTo(request, "/access-unavailable");
    }

    return response;
  }

  if (!profile) {
    if (isPrivatePath(pathname)) {
      return redirectTo(request, "/register");
    }

    return response;
  }

  if (profile.status === "pending" && isPrivatePath(pathname)) {
    return redirectTo(request, "/pending-approval");
  }

  if (profile.status === "rejected" && isPrivatePath(pathname)) {
    return redirectTo(request, "/request-rejected");
  }

  if (profile.status === "disabled" && isPrivatePath(pathname)) {
    return redirectTo(request, "/account-disabled");
  }

  if (profile.status !== "active") {
    return response;
  }

  if (profile.global_role === "superadmin") {
    if (pathname === "/buildings" || isAuthPath(pathname)) {
      return redirectTo(request, "/superadmin/requests");
    }

    return response;
  }

  const { data: tenantMembership, error: tenantMembershipError } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("role", "tenant_admin")
    .eq("status", "active")
    .limit(1)
    .maybeSingle<{ tenant_id: string }>();

  if (tenantMembershipError) {
    if (isPrivatePath(pathname)) {
      return redirectTo(request, "/access-unavailable");
    }

    return response;
  }

  if (tenantMembership) {
    if (pathname.startsWith("/superadmin") || isAuthPath(pathname)) {
      return redirectTo(request, "/buildings");
    }

    return response;
  }

  if (isPrivatePath(pathname) || isAuthPath(pathname)) {
    return redirectTo(request, "/access-unavailable");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
