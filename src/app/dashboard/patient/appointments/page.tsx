import { Suspense } from "react";
import { getPatientAppointmentHistory } from "@/features/patients/actions";
import { auth } from "@/lib/auth/auth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cancelAppointment } from "@/features/appointments/actions";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  COMPLETED: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

async function PatientAppointments() {
  const session = await auth();
  if (!session?.user?.patientId) return <div>No hay perfil de paciente asociado.</div>;

  const history = await getPatientAppointmentHistory(session.user.patientId);

  return (
    <div className="space-y-4">
      {history.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
          <p className="text-slate-500 mb-4">Aún no has solicitado ningún turno.</p>
          <Link href="/dashboard/patient/appointments/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700">Solicitar Primer Turno</Button>
          </Link>
        </div>
      ) : (
        history.map((a) => (
          <div key={a.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {format(new Date(a.startTime), "EEEE dd 'de' MMMM, HH:mm", { locale: es })}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[a.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {STATUS_LABELS[a.status] ?? a.status}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">Especialista: Dr/a. {a.doctor.lastName}</p>
              {a.rescheduledFromDate && (
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  Reprogramado desde el turno original del {format(new Date(a.rescheduledFromDate), "dd/MM/yyyy HH:mm")}
                </p>
              )}
            </div>
            
            {(a.status === "PENDING" || a.status === "CONFIRMED") && (
              <div className="flex gap-2 w-full sm:w-auto">
                <form action={async () => { "use server"; await cancelAppointment(a.id); }}>
                  <Button variant="destructive" size="sm" type="submit" className="w-full sm:w-auto">Cancelar</Button>
                </form>
                <Link href={`/dashboard/patient/appointments/reschedule?id=${a.id}`}>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">Reprogramar</Button>
                </Link>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default function PatientAppointmentsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Mis Turnos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestiona tus próximos turnos y consulta tu historial.</p>
        </div>
        <Link href="/dashboard/patient/appointments/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Solicitar Turno
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Cargando historial...</div>}>
        <PatientAppointments />
      </Suspense>
    </div>
  );
}
