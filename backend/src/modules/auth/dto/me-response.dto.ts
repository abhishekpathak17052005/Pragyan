/**
 * GET /auth/me Response DTO
 * Returns comprehensive user profile after login
 * Frontend fetches this separately to avoid bloating JWT
 */

export class MeResponseDTO {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  role: string;
  organization?: {
    id: string;
    name: string;
    type: string;
  };
  profile?: {
    type: "student" | "recruiter" | "placement_officer";
    data: Record<string, any>;
  };
  permissions: string[];
  emailVerified: boolean;
  createdAt: Date;

  constructor(data: {
    id: string;
    email: string;
    fullName: string;
    avatar?: string;
    role: string;
    organizationId?: string;
    organizationName?: string;
    organizationType?: string;
    profileType?: "student" | "recruiter" | "placement_officer";
    profileData?: Record<string, any>;
    permissions?: string[];
    emailVerified: boolean;
    createdAt: Date;
  }) {
    this.id = data.id;
    this.email = data.email;
    this.fullName = data.fullName;
    this.avatar = data.avatar;
    this.role = data.role;
    this.permissions = data.permissions || [];
    this.emailVerified = data.emailVerified;
    this.createdAt = data.createdAt;

    if (data.organizationId && data.organizationName) {
      this.organization = {
        id: data.organizationId,
        name: data.organizationName,
        type: data.organizationType || "UNKNOWN",
      };
    }

    if (data.profileType && data.profileData) {
      this.profile = {
        type: data.profileType,
        data: data.profileData,
      };
    }
  }
}
