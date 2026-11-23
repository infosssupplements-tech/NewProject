/**
 * Pure utility functions for Upolabdhi RAG pipeline simulation,
 * carousel navigation, and input validation.
 */

export const RAG_STAGES = [
  "Receiving document",
  "Extracting text & structure",
  "Chunking with context overlap",
  "Generating vector embeddings",
  "Vector index ready for Q&A",
];

export function clampProgress(val: number): number {
  if (isNaN(val)) return 0;
  return Math.max(0, Math.min(100, Math.round(val)));
}

export function calculateStageProgress(
  progressPercent: number,
  stages = RAG_STAGES,
): { currentStage: string; stageProgress: number; stageIndex: number } {
  const p = clampProgress(progressPercent);
  if (stages.length === 0) {
    return { currentStage: "", stageProgress: p, stageIndex: 0 };
  }
  const stageCount = stages.length;
  const stageSpan = 100 / stageCount;
  const stageIndex = Math.min(stageCount - 1, Math.floor(p / stageSpan));
  const stageProgress = Math.min(100, Math.round(((p - stageIndex * stageSpan) / stageSpan) * 100));

  return {
    currentStage: stages[stageIndex],
    stageProgress,
    stageIndex,
  };
}

export function getNextSlideIndex(current: number, total: number, direction = 1): number {
  if (total <= 0) return 0;
  return (current + direction + total) % total;
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 8) {
    return { valid: false, reason: "Password must be at least 8 characters long." };
  }
  if (password.length > 128) {
    return { valid: false, reason: "Password must not exceed 128 characters." };
  }
  return { valid: true };
}
