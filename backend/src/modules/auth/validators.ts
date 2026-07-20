/**
 * Auth Module - Zod Validators
 */

import { z } from "zod";
import { PASSWORD_CONSTANTS } from "./constants";

/**
 * Email validation schema
 */
const emailSchema = z
  .string()
  .email("Invalid email format")
  .toLowerCase()
  .trim();

/**
 * Password validation schema
 */
const passwordSchema = z
  .string()
  .min(
    PASSWORD_CONSTANTS.MIN_LENGTH,
    `Password must be at least ${PASSWORD_CONSTANTS.MIN_LENGTH} characters`
  )
  .refine(
    (pwd) => !PASSWORD_CONSTANTS.REQUIRE_UPPERCASE || /[A-Z]/.test(pwd),
    "Password must contain at least one uppercase letter"
  )
  .refine(
    (pwd) => !PASSWORD_CONSTANTS.REQUIRE_NUMBERS || /\d/.test(pwd),
    "Password must contain at least one number"
  )
  .refine(
    (pwd) => !PASSWORD_CONSTANTS.REQUIRE_SPECIAL || /[@$!%*?&]/.test(pwd),
    "Password must contain at least one special character (@$!%*?&)"
  );

/**
 * Register Validator
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters")
      .trim(),
    role: z.enum(["STUDENT", "RECRUITER", "PLACEMENT_OFFICER"]),
    collegeCode: z.string().optional(),
    companyInviteToken: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Passwords must match
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
    // College code required for students
    if (data.role === "STUDENT" && !data.collegeCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "College code required for students",
        path: ["collegeCode"],
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login Validator
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Email Verification Validator
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token required"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/**
 * Refresh Token Validator
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * Forgot Password Validator
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset Password Validator
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token required"),
    otp: z
      .string()
      .regex(/^\d{6}$/, "OTP must be 6 digits")
      .optional()
      .or(z.literal("")),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Logout Validator
 */
export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export type LogoutInput = z.infer<typeof logoutSchema>;

/**
 * Change Password Validator
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * OTP Validator
 */
export const otpSchema = z
  .string()
  .regex(/^\d{6}$/, "OTP must be 6 digits");

/**
 * Validator wrapper for middleware
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
