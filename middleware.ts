import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { auth } from "./lib/auth";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PATHS = ["/compte"];

function isProtected(pathname: string): boolean {
  return routing.locales.some((locale) =>
    PROTECTED_PATHS.some((p) => pathname.startsWith(`/${locale}${p}`)),
  );
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isProtected(pathname)) {
    const session = await auth();
    if (!session?.user) {
      const locale = pathname.split("/")[1] ?? routing.defaultLocale;
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/sign-in`;
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
