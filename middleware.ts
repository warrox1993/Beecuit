import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasLocale = routing.locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocale) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/${routing.defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
