export const EXAM_STATUS = {
  ACTIVE: 1,
  COMPLETED: 2
} as const;

export type ExamStatusType = typeof EXAM_STATUS[keyof typeof EXAM_STATUS];

// Optional: Export status names for display purposes
export const EXAM_STATUS_NAMES = {
  [EXAM_STATUS.ACTIVE]: 'Active',
  [EXAM_STATUS.COMPLETED]: 'Completed'
} as const;