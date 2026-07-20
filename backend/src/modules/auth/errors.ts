/**
 * Auth Module - Custom Error Classes
 */

import { AppError } from "@/utils/errors";

export class InvalidCredentialsError extends AppError {
  constructor(message: string = "Invalid email or password") {
    super(401, message);
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor(
    message: string = "Please verify your email first before logging in"
  ) {
    super(403, message);
  }
}

export class AccountInactiveError extends AppError {
  constructor(message: string = "Your account is not active") {
    super(403, message);
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = "Invalid or expired token") {
    super(401, message);
  }
}

export class EmailAlreadyExistsError extends AppError {
  constructor(message: string = "Email already registered") {
    super(409, message);
  }
}

export class OTPExpiredError extends AppError {
  constructor(message: string = "OTP has expired") {
    super(401, message);
  }
}

export class OTPInvalidError extends AppError {
  constructor(message: string = "Invalid OTP") {
    super(401, message);
  }
}

export class AccountSuspendedError extends AppError {
  constructor(message: string = "Your account has been suspended") {
    super(403, message);
  }
}

export class MaxLoginAttemptsError extends AppError {
  constructor(
    message: string = "Too many login attempts. Try again in 15 minutes."
  ) {
    super(401, message);
  }
}

export class WeakPasswordError extends AppError {
  constructor(
    message: string = "Password does not meet security requirements"
  ) {
    super(422, message);
  }
}

export class TokenRequiredError extends AppError {
  constructor(message: string = "Authorization token required") {
    super(401, message);
  }
}

export class PermissionDeniedError extends AppError {
  constructor(message: string = "You do not have permission") {
    super(403, message);
  }
}

export class InvalidInvitationError extends AppError {
  constructor(message: string = "Invalid or expired invitation") {
    super(401, message);
  }
}

export class RoleNotFoundError extends AppError {
  constructor(message: string = "Role not found") {
    super(404, message);
  }
}

export class OrganizationNotFoundError extends AppError {
  constructor(message: string = "Organization not found") {
    super(404, message);
  }
}
