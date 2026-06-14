import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db/prisma";
import { DoctorAgendaClient } from "./DoctorAgendaClient";

export default async function DoctorAgendaPage() {
  const session = await auth();
  if (!session?.user?.doctorId) redirect("/dashboard");

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: session.user.doctorId,
      deletedAt: null,
      startTime: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, phone: true, birthDate: true } },
      medicalNote: { select: { id: true, content: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const serialized = appointments.map((a) => ({
    ...a,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    deletedAt: a.deletedAt?.toISOString() ?? null,
    patient: {
      ...a.patient,
      birthDate: a.patient.birthDate?.toISOString() ?? null,
    },
  }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Mi Agenda</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Turnos de hoy en adelante. Confirmá, completá y escribí notas clínicas.
        </p>
      </div>
      <DoctorAgendaClient appointments={serialized} />
    </div>
  );
}
