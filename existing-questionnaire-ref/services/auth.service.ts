import { signIn, signOut } from "next-auth/react";
import type { User } from "../types";
import { DEMO_USERS } from "../mocks/users";

export class AuthService {
  static async login(email: string, passwordHash: string): Promise<User> {
    const demo = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    try {
      const res = await signIn("credentials", {
        email,
        password: passwordHash,
        redirect: false,
      });

      if (!res || res.error || !res.ok) {
        if (demo) {
          if (typeof window !== "undefined") {
            localStorage.setItem("breastcare_user", JSON.stringify(demo));
          }
          return demo;
        }

        throw new Error(res?.error || "Invalid email or password");
      }

      const user = await this.getCurrentUserAsync();

      if (user) {
        return user;
      }

      if (demo) {
        if (typeof window !== "undefined") {
          localStorage.setItem("breastcare_user", JSON.stringify(demo));
        }
        return demo;
      }

      throw new Error("Unable to retrieve authenticated user details.");
    } catch (err: any) {
      if (demo) {
        if (typeof window !== "undefined") {
          localStorage.setItem("breastcare_user", JSON.stringify(demo));
        }
        return demo;
      }

      throw err;
    }
  }

  static async register(
    name: string,
    email: string,
    passwordHash: string
  ): Promise<User> {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password: passwordHash,
        role: "PATIENT",
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Registration failed");
    }

    return await this.login(email, passwordHash);
  }

  static async getCurrentUserAsync(): Promise<User | null> {
    try {
      const res = await fetch("/api/auth/session", {
        credentials: "include",
      });

      if (res.ok) {
        const session = await res.json();

        if (session && session.user) {
          const user = session.user as User;

          if (typeof window !== "undefined") {
            localStorage.setItem(
              "breastcare_user",
              JSON.stringify(user)
            );
          }

          return user;
        }
      }
    } catch (e) {
      // Ignore fetch error
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("breastcare_user");

      if (stored) {
        try {
          return JSON.parse(stored) as User;
        } catch (e) {
          // Ignore invalid stored user data
        }
      }
    }

    return null;
  }

  static getCurrentUser(): User | null {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("breastcare_user");

      if (stored) {
        try {
          return JSON.parse(stored) as User;
        } catch (e) {
          // Ignore invalid stored user data
        }
      }
    }

    return null;
  }

  static async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem("breastcare_user");
    }

    try {
      await signOut({ redirect: false });
    } catch (e) {
      // Ignore logout errors
    }
  }
}