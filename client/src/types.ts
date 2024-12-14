export interface BookWithSummary {
  id: number;
  title: string;
  author: string;
  coverUrl: string | null;
  category: string | null;
  tags: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  summary: {
    id: number;
    content: string;
    audioUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  isFavorite?: boolean;
  recommendationScore?: number;
}

export interface CreateBookInput {
  title: string;
  author: string;
  coverUrl?: string;
  summary: string;
}
