import { Hono } from "hono";
import {
  signUp,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  guestLogin,
  getUser,
  createAndSendVerificationEmail,
  AuthError,
} from "../services/auth.service";
import { verifyAccessToken } from "../auth/jwt";

export const authRouter = new Hono();

function errorResponse(c: any, err: unknown) {
  if (err instanceof AuthError) {
    const status = err.code === "USER_NOT_FOUND" || err.code === "INVALID_CREDENTIALS" ? 401
      : err.code === "USER_ALREADY_EXISTS" ? 409
      : err.code === "WEAK_PASSWORD" ? 422
      : err.code === "INVALID_TOKEN" || err.code === "INVALID_REFRESH_TOKEN" ? 401
      : 400;
    return c.json({ error: err.message, code: err.code }, status);
  }
  console.error("[auth]", err);
  return c.json({ error: "Internal server error" }, 500);
}

// ─── POST /signup ────────────────────────────────────────────────────

authRouter.post("/signup", async (c) => {
  try {
    const { email, password, name, returnTo } = await c.req.json();
    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required." }, 400);
    }
    const result = await signUp(email, password, name, returnTo);
    return c.json(result, 201);
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── POST /login ─────────────────────────────────────────────────────

authRouter.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "Email and password are required." }, 400);
    }
    const result = await login(email, password);
    return c.json(result);
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── POST /refresh ───────────────────────────────────────────────────

authRouter.post("/refresh", async (c) => {
  try {
    const { refreshToken } = await c.req.json();
    if (!refreshToken) {
      return c.json({ error: "Refresh token is required." }, 400);
    }
    const result = await refreshAccessToken(refreshToken);
    return c.json(result);
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── POST /logout ────────────────────────────────────────────────────

authRouter.post("/logout", async (c) => {
  try {
    const { refreshToken } = await c.req.json();
    if (refreshToken) {
      await logout(refreshToken);
    }
    return c.json({ success: true });
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── POST /forgot-password ──────────────────────────────────────────

authRouter.post("/forgot-password", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ error: "Email is required." }, 400);
    }
    await forgotPassword(email);
    // Always return success to prevent email enumeration
    return c.json({ success: true });
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── POST /reset-password ───────────────────────────────────────────

authRouter.post("/reset-password", async (c) => {
  try {
    const { token, newPassword } = await c.req.json();
    if (!token || !newPassword) {
      return c.json({ error: "Token and new password are required." }, 400);
    }
    await resetPassword(token, newPassword);
    return c.json({ success: true });
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── POST /verify-email ─────────────────────────────────────────────

authRouter.post("/verify-email", async (c) => {
  try {
    const { token } = await c.req.json();
    if (!token) {
      return c.json({ error: "Token is required." }, 400);
    }
    const result = await verifyEmail(token);
    return c.json({ success: true, ...result });
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── POST /resend-verification ──────────────────────────────────────

authRouter.post("/resend-verification", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Authentication required." }, 401);
    }
    
    // Parse JSON body to get returnTo, default to empty object if no body provided
    let returnTo: string | undefined;
    try {
      const body = await c.req.json();
      returnTo = body.returnTo;
    } catch (e) {
      // Ignore JSON parse errors for empty bodies
    }

    const { userId, email } = await verifyAccessToken(authHeader.slice(7));
    const user = await getUser(userId);
    await createAndSendVerificationEmail(userId, email, user.name, returnTo);
    return c.json({ success: true });
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── POST /guest ─────────────────────────────────────────────────────

authRouter.post("/guest", async (c) => {
  try {
    const { name } = await c.req.json();
    if (!name?.trim()) {
      return c.json({ error: "Name is required." }, 400);
    }
    const result = await guestLogin(name.trim());
    return c.json(result, 201);
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── GET /me ─────────────────────────────────────────────────────────

authRouter.get("/me", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const { userId } = await verifyAccessToken(authHeader.slice(7));
    const user = await getUser(userId);
    return c.json({ user });
  } catch (err) {
    return c.json({ error: "Unauthorized" }, 401);
  }
});
