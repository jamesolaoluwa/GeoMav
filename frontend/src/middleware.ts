import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname.startsWith("/signin") || pathname.startsWith("/signup");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  const hasOnboardedCookie =
    request.cookies.get("geomav_onboarded")?.value === "true";

  if ((isDashboardRoute || isOnboardingRoute) && !user) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (isDashboardRoute && user) {
    if (!hasOnboardedCookie) {
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      if (businesses && businesses.length > 0) {
        supabaseResponse.cookies.set("geomav_onboarded", "true", {
          path: "/",
          maxAge: 31536000,
        });
      } else {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }
  }

  if (isAuthRoute && user) {
    if (hasOnboardedCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);
    if (businesses && businesses.length > 0) {
      supabaseResponse.cookies.set("geomav_onboarded", "true", {
        path: "/",
        maxAge: 31536000,
      });
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
