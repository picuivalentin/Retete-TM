import { AdminConsole } from "@/components/AdminConsole";

export const metadata = {
  title: "Administrare",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminConsole />;
}
