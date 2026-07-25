import { api } from "@/services/apiClient";
import type { AuthUser, Certification, PortfolioProject, ProfileBuilderData } from "@/types/api";

/**
 * Shape accepted by both PUT /profile and PATCH /auth/me.
 * Mirrors the backend profileUpdateSchema — all fields optional.
 */
export type ProfileUpdatePayload = Partial<AuthUser> & {
  firstName?: string;
  lastName?: string;
  gender?: string;
  country?: string;
  state?: string;
  city?: string;
  currentStatus?: string;
  collegeName?: string;
  university?: string;
  degree?: string;
  branch?: string;
  currentYear?: string;
  expectedGraduationYear?: number | null;
  programmingExperience?: string;
  previouslyWorked?: boolean;
  yearsOfExperience?: number | null;
  currentCompany?: string;
  currentRole?: string;
  careerGoal?: string;
  // allow any additional backend-accepted keys
  [key: string]: unknown;
};

export const profileService = {
  /** GET /api/profile — full profile builder data */
  getProfile() {
    return api.get<ProfileBuilderData>("/profile");
  },

  /**
   * PUT /api/profile — update core profile fields.
   * Routes through profileBuilderController.updateCoreProfile
   * → authService.updateUserProfile (single source of truth).
   */
  updateProfile(input: ProfileUpdatePayload) {
    return api.put<AuthUser>("/profile", input);
  },

  /**
   * PATCH /api/auth/me — lightweight profile patch.
   * Use this when only updating a small subset of fields
   * and you want the response to include the refreshed AuthUser.
   */
  patchProfile(input: ProfileUpdatePayload) {
    return api.patch<AuthUser>("/auth/me", input);
  },

  startProviderLink(provider: "github" | "google") {
    return api.post<{ redirectUrl: string }>(`/profile/link/${provider}`);
  },

  createProject(input: Omit<PortfolioProject, "id">) {
    return api.post<PortfolioProject>("/profile/builder/projects", input);
  },

  createCertification(input: Omit<Certification, "id">) {
    return api.post<Certification>("/profile/builder/certifications", input);
  },
};
