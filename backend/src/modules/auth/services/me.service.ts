/**
 * Me Service
 * Handles GET /auth/me endpoint
 */

import { MeResponseDTO } from "../dto";
import { userRepository } from "../repository";

export class MeService {
  /**
   * Get current user profile
   * 
   * Fetches comprehensive user data after authentication
   * Frontend calls this once after login to get full profile
   * 
   * Returns: MeResponseDTO with:
   * - Basic info (id, email, fullName, avatar, role)
   * - Organization (if part of organization)
   * - Profile (student/recruiter/officer specific data)
   * - Permissions (role-based access control)
   * - Verification status
   */
  async getMe(userId: string): Promise<MeResponseDTO> {
    // 1. Fetch user with all relations
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // 2. Determine profile type and data
    let profileType: "student" | "recruiter" | "placement_officer" | undefined;
    let profileData: Record<string, any> | undefined;

    if (user.studentProfile) {
      profileType = "student";
      profileData = this.mapStudentProfile(user.studentProfile);
    } else if (user.recruiterProfile) {
      profileType = "recruiter";
      profileData = this.mapRecruiterProfile(user.recruiterProfile);
    } else if (user.placementOfficerProfile) {
      profileType = "placement_officer";
      profileData = this.mapOfficerProfile(user.placementOfficerProfile);
    }

    // 3. Build response DTO
    // Note: organizationId is included but organization details not fetched
    // (Organization model doesn't have relation in current schema)
    return new MeResponseDTO({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar || undefined,
      role: user.userRole || "STUDENT", // Default to STUDENT if not set
      organizationId: user.organizationId || undefined,
      profileType,
      profileData,
      permissions: [], // TODO: Implement in Unit 10 when authorization is added
      emailVerified: user.emailVerifiedAt !== null,
      createdAt: user.createdAt,
    });
  }

  /**
   * Helper: Map student profile to DTO
   */
  private mapStudentProfile(profile: any): Record<string, any> {
    return {
      rollNumber: profile.rollNumber,
      courseYear: profile.courseYear,
      branch: profile.branch,
      cgpa: profile.cgpa,
      verified: profile.verified,
    };
  }

  /**
   * Helper: Map recruiter profile to DTO
   */
  private mapRecruiterProfile(profile: any): Record<string, any> {
    return {
      companyName: profile.companyName,
      designation: profile.designation,
      verified: profile.verified,
    };
  }

  /**
   * Helper: Map placement officer profile to DTO
   */
  private mapOfficerProfile(profile: any): Record<string, any> {
    return {
      designation: profile.designation,
      department: profile.department,
      verified: profile.verified,
    };
  }
}

export const meService = new MeService();
