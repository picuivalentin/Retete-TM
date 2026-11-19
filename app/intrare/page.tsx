import { AccessGate } from "@/components/AccessGate";

export const metadata = {
  title: "Intrare",
  robots: { index: false, follow: false },
};

export default function AccessPage() {
  return <AccessGate />;
}
