import AdminDashboard from "@/components/admin/AdminDashboard";
import Header from "@/components/Header";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header isAdmin={true} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 font-headline">Admin Control Panel</h1>
        <AdminDashboard />
      </main>
    </div>
  );
}
