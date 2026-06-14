import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register")
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard")

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn && isDashboardRoute) {
    let callbackUrl = nextUrl.pathname
    if (nextUrl.search) {
      callbackUrl += nextUrl.search
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl)
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl))
  }

  if (isLoggedIn && isDashboardRoute) {
    const role = req.auth?.user?.role
    const path = nextUrl.pathname

    if (path.startsWith("/dashboard/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/403", nextUrl))
    }

    if (path.startsWith("/dashboard/doctor") && role !== "DOCTOR" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/403", nextUrl))
    }

    if (path.startsWith("/dashboard/patient") && role !== "PATIENT" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/403", nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
