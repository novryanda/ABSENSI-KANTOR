import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../prismaClient";
import { AuthService } from "./AuthService";
import { PrismaUserRepository } from "../database/repositories/UserRepository";

const userRepository = new PrismaUserRepository(prisma);
const authService = new AuthService(userRepository);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or NIP", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Identifier and password required");
        }

        try {
          const user = await authService.login({
            identifier: credentials.identifier,
            password: credentials.password
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            // Custom fields
            nip: user.nip,
            phone: user.phone,
            status: user.status,
            role: user.role,
            department: user.department,
          };
        } catch (error) {
          // Tambahkan log error detail
          console.error("Authentication error:", error);
          // Jika error, return null agar NextAuth mengembalikan 401
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt", // Using JWT for better performance
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.id = user.id;
        token.nip = (user as any).nip;
        token.phone = (user as any).phone;
        token.status = (user as any).status;
        token.role = (user as any).role;
        token.department = (user as any).department;
      }

      // Return previous token if the access token has not expired yet
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).nip = token.nip;
        (session.user as any).phone = token.phone;
        (session.user as any).status = token.status;
        (session.user as any).role = token.role;
        (session.user as any).department = token.department;

        // Refresh user data periodically
        try {
          const refreshedUser = await authService.refreshUserSession(token.id as string);
          (session.user as any) = { ...session.user, ...refreshedUser };
        } catch (error) {
          console.error("Session refresh error:", error);
        }
      }

      return session;
    },
    async signIn({ user, account, profile }) {
      // For OAuth providers, check if user exists and is active
      if (account?.provider === "google") {
        const existingUser = await userRepository.findByEmail(user.email!);
        if (existingUser && !existingUser.canLogin()) {
          return false; // Prevent sign in for inactive users
        }
      }
      return true;
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User signed in: ${user.email}`);
      
      // Update last login for existing users
      if (!isNewUser && user.id) {
        const existingUser = await userRepository.findById(user.id);
        if (existingUser) {
          existingUser.updateLastLogin();
          await userRepository.update(existingUser);
        }
      }
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token?.email}`);
    }
  },
  debug: process.env.NODE_ENV === 'development',
};
