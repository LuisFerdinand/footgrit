import type { Role } from "@/lib/auth/rbac";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      title?: string | null;
      clubId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    title?: string | null;
    clubId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    title?: string | null;
    clubId?: string | null;
  }
}
