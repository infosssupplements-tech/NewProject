import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getCurrentUser, isAuthenticated, login, logout } from "../Actions/LoginAction.js";
import { register, resendVerificationOtp, verifyEmail } from "../Actions/SignUpAction.js";
import {
  resendForgotPasswordOTP,
  resetPassword,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
} from "../Actions/ForgotPasswordAction.js";

const AuthContext = createContext(null);

function getStoredUser() {
  if (!isAuthenticated()) return null;

  const storedUser =
    localStorage.getItem("upolobdhi-user") || sessionStorage.getItem("upolobdhi-user");
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    logout();
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  const signIn = useCallback(async ({ email, password, remember }) => {
    await login(email, password, remember);
    const currentUser = await getCurrentUser();
    const storage = localStorage.getItem("access_token") ? localStorage : sessionStorage;
    const otherStorage = storage === localStorage ? sessionStorage : localStorage;
    storage.setItem("upolobdhi-user", JSON.stringify(currentUser));
    otherStorage.removeItem("upolobdhi-user");
    setUser(currentUser);
    return currentUser;
  }, []);

  const signUp = useCallback(
    ({ name, email, password }) => register(name, email, password),
    [],
  );
  const confirmSignUp = useCallback((email, otp) => verifyEmail(email, otp), []);
  const resendSignUpCode = useCallback((email) => resendVerificationOtp(email), []);

  const requestPasswordReset = useCallback((email) => sendForgotPasswordOTP(email), []);
  const verifyPasswordResetOtp = useCallback(
    (email, otp) => verifyForgotPasswordOTP(email, otp),
    [],
  );
  const confirmPasswordReset = useCallback(
    (resetToken, newPassword) => resetPassword(resetToken, newPassword),
    [],
  );
  const resendPasswordResetOtp = useCallback((email) => resendForgotPasswordOTP(email), []);

  const signOut = useCallback(() => {
    logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      signIn,
      signUp,
      confirmSignUp,
      resendSignUpCode,
      requestPasswordReset,
      verifyPasswordResetOtp,
      confirmPasswordReset,
      resendPasswordResetOtp,
      signOut,
    }),
    [
      user,
      signIn,
      signUp,
      confirmSignUp,
      resendSignUpCode,
      requestPasswordReset,
      verifyPasswordResetOtp,
      confirmPasswordReset,
      resendPasswordResetOtp,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

