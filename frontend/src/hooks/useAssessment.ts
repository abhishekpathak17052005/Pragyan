import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assessmentService } from "@/services/assessmentService";
import type {
  Phase1Input,
  Phase2Input,
} from "@/services/assessmentService";

// ── Questions ─────────────────────────────────────────────────────────────────

export function useAssessmentQuestions(enabled = false) {
  return useQuery({
    queryKey: ["assessment", "questions"],
    queryFn: assessmentService.getQuestions,
    enabled,
  });
}

// ── Phase 1 ───────────────────────────────────────────────────────────────────

export function usePhase1Data() {
  return useQuery({
    queryKey: ["assessment", "phase-1"],
    queryFn: assessmentService.getPhase1,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSavePhase1() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Phase1Input) => assessmentService.savePhase1(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment", "phase-1"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUpdatePhase1() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Phase1Input) => assessmentService.updatePhase1(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment", "phase-1"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

// ── Phase 2 ───────────────────────────────────────────────────────────────────

export function usePhase2Data() {
  return useQuery({
    queryKey: ["assessment", "phase-2"],
    queryFn: assessmentService.getPhase2,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSavePhase2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Phase2Input) => assessmentService.savePhase2(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment", "phase-2"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUpdatePhase2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Phase2Input) => assessmentService.updatePhase2(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment", "phase-2"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

// ── Adaptive assessment ───────────────────────────────────────────────────────

export function useStartAdaptiveAssessment() {
  return useMutation({
    mutationFn: () => assessmentService.startAdaptiveAssessment(),
  });
}

// ── Legacy (kept for backward compatibility) ──────────────────────────────────

export function useAssessment() {
  return {
    saveProfile:      useMutation({ mutationFn: assessmentService.saveProfile }),
    saveSkills:       useMutation({ mutationFn: assessmentService.saveSkills }),
    saveAssessment:   useMutation({ mutationFn: assessmentService.saveAssessment }),
    submitAssessment: useMutation({ mutationFn: assessmentService.submitAssessment }),
  };
}
