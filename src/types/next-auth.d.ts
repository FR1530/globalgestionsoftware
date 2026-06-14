import NextAuth, { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      doctorId?: string
      patientId?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    doctorId?: string
    patientId?: string
  }
}
