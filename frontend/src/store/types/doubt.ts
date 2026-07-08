/** Live doubt row — mirrors API shape. */
export type Doubt = {
  id: string;
  authorId: string;
  authorName: string;
  /** 2-letter avatar fallback */
  authorInitials: string;
  exam: string;
  subject: string;
  title: string;
  /** Short preview under title */
  preview: string;
  createdAt: string;
  viewerCount: number;
  /** Peers offering / in thread */
  helperCount: number;
  urgent: boolean;
  resolved: boolean;
  needFasterMethod: boolean;
  mySolveTime: string | null;
};
