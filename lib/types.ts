export type Recipe = {
  id: string;
  sourceUrl: string;
  language: string;
  title: string;
  imageUrl: string | null;
  prepMinutes: number | null;
  totalMinutes: number | null;
  servings: number | null;
  yieldText: string | null;
  tools: string[];
  ingredients: string[];
  instructions: string[];
  category: string;
  categoryLocked: boolean;
  note: string;
  createdAt: number;
  updatedAt: number;
};
