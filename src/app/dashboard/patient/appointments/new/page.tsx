import prisma from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { NewAppointmentForm } from "@/components/appointments/NewAppointmentForm";

export default async function NewAppointmentPage() {
  const session = await auth();
  if (!session?.user?.patientId) {
    redirect("/dashboard");
  }

  const doctors = await prisma.doctor.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      specialty: true,
      appointmentDurationMinutes: true,
      availabilities: {
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
    },
    orderBy: { lastName: "asc" },
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Solicitar Nuevo Turno</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Busca disponibilidad en tiempo real y reserva tu lugar instantáneamente.
        </p>
      </div>

      <NewAppointmentForm doctors={doctors} patientId={session.user.patientId} />
    </div>
  );
}
