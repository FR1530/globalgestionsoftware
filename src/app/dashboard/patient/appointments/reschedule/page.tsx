import prisma from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { redirect, notFound } from "next/navigation";
import { RescheduleForm } from "./RescheduleForm";

export default async function ReschedulePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) redirect("/dashboard/patient/appointments");

  const session = await auth();
  if (!session?.user?.patientId) redirect("/dashboard");

  const appointment = await prisma.appointment.findUnique({
    where: { id, patientId: session.user.patientId, deletedAt: null },
    include: {
      doctor: {
        include: { availabilities: true },
      },
    },
  });

  if (!appointment) notFound();
  if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
    redirect("/dashboard/patient/appointments");
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Reprogramar Turno
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Seleccioná una nueva fecha y horario para tu turno con el Dr.{" "}
          {appointment.doctor.firstName} {appointment.doctor.lastName}.
        </p>
      </div>

      <RescheduleForm
        appointment={{
          id: appointment.id,
          startTime: appointment.startTime.toISOString(),
          doctor: {
            id: appointment.doctor.id,
            firstName: appointment.doctor.firstName,
            lastName: appointment.doctor.lastName,
            specialty: appointment.doctor.specialty,
            appointmentDurationMinutes: appointment.doctor.appointmentDurationMinutes,
            availabilities: appointment.doctor.availabilities.map((a) => ({
              dayOfWeek: a.dayOfWeek,
              startTime: a.startTime,
              endTime: a.endTime,
            })),
          },
        }}
      />
    </div>
  );
}
