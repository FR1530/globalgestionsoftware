import prisma from "@/lib/db/prisma";
import { AppointmentsPageClient } from "./AppointmentsPageClient";

export default async function AppointmentsPage() {
  const [appointments, patients, doctors] = await Promise.all([
    prisma.appointment.findMany({
      where: { deletedAt: null },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, firstName: true, lastName: true, specialty: true } },
      },
      orderBy: { startTime: "desc" },
    }),
    prisma.patient.findMany({
      where: { deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.doctor.findMany({
      where: { deletedAt: null },
      select: { id: true, firstName: true, lastName: true, specialty: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  const serialized = appointments.map((a) => ({
    ...a,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    deletedAt: a.deletedAt?.toISOString() ?? null,
  }));

  return <AppointmentsPageClient appointments={serialized} patients={patients} doctors={doctors} />;
}
