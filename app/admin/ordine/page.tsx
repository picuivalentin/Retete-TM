import { RecipeOrder } from "@/components/RecipeOrder";

export const metadata = {
  title: "Ordinea rețetelor",
  robots: { index: false, follow: false },
};

export default function RecipeOrderPage() {
  return <RecipeOrder />;
}
