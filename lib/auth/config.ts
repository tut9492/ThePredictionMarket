import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { getUsername } from "@/lib/storage/users"

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }: any) {
      // Add username to session if available
      if (session?.user?.email) {
        const username = await getUsername(session.user.email)
        if (username) {
          session.user.username = username
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}

export const { auth, handlers } = NextAuth(authOptions)

