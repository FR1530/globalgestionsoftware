import { auth } from "@/lib/auth/auth";
import { getDashboardStats } from "@/features/dashboard/actions";
import { DashboardCharts } from "@/components/dashboard/charts";
import { Users, UserPlus, Calendar as CalendarIcon, Activity } from "lucide-react";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    { label: "Médicos Activos", value: stats.activeDoctorsCount, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Pacientes", value: stats.registeredPatientsCount, icon: Users, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Turnos Hoy", value: stats.todayAppointmentsCount, icon: CalendarIcon, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Total Registros", value: stats.activeDoctorsCount + stats.registeredPatientsCount, icon: UserPlus, color: "text-rose-600", bg: "bg-rose-100" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard Administrativo</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Visión general del sistema de turnos médicos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${card.bg} dark:bg-opacity-10`}>
                <Icon className={`w-7 h-7 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <DashboardCharts 
        appointmentsByStatus={stats.appointmentsByStatus}
        appointmentsByMonth={stats.appointmentsByMonth}
      />
    </div>
  );
}
