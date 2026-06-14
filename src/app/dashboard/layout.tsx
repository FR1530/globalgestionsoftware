import { ReactNode } from "react";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Users, Activity, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  const links = [
    { href: "/dashboard", label: "Overview", icon: Activity },
    ...(role === "ADMIN" ? [
      { href: "/dashboard/admin/doctors", label: "Médicos", icon: Users },
      { href: "/dashboard/admin/patients", label: "Pacientes", icon: Users },
      { href: "/dashboard/admin/appointments", label: "Todos los Turnos", icon: Calendar },
    ] : []),
    ...(role === "DOCTOR" ? [
      { href: "/dashboard/doctor/agenda", label: "Mi Agenda", icon: Calendar },
    ] : []),
    ...(role === "PATIENT" ? [
      { href: "/dashboard/patient/appointments", label: "Mis Turnos", icon: Calendar },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            MediTurnos
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors font-medium"
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
              {session.user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden text-ellipsis text-sm font-medium text-slate-700 dark:text-slate-300">
              {session.user.email}
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
