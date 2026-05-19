import { auth } from "@/lib/auth"
import {
  NextResponse,
  type NextFetchEvent,
  type NextMiddleware,
} from "next/server"
import type { NextAuthRequest } from "next-auth"

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
}

function applySecurityHeaders(response: Response): Response {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(k, v)
  }
  return response
}

// Wrap NextAuth's `auth` middleware so we can attach security headers to
// every response — including redirects to /login from the auth check and
// any pass-through responses on public/protected routes.
//
// The two-arg `(req, _event)` callback signature ensures TypeScript selects
// the `NextAuthMiddleware` overload of `auth(...)` (rather than the
// `AppRouteHandlerFn` route-handler overload).
const middleware: NextMiddleware = auth(
  (req: NextAuthRequest, _event: NextFetchEvent) => {
    const response = NextResponse.next({ request: req })
    return applySecurityHeaders(response)
  }
)

export default middleware

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
