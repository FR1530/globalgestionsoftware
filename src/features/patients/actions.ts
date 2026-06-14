"use server";

import prisma from "@/lib/db/prisma";

export async function getPatientAppointmentHistory(patientId: string) {
  const appointments = await prisma.appointment.findMany({
    where: {
      patientId,
      // Se pueden incluir los eliminados lógicamente si el negocio lo pide para historial,
      // pero por defecto el prompt dice: "Todas las queries por defecto deben filtrar deletedAt: null, salvo en vistas administrativas de auditoría/historial si se decide incluirlas."
      // Para el historial del paciente, mostraremos todos (incluso cancelados) que no estén soft-deleted.
      deletedAt: null,
    },
    orderBy: {
      startTime: "desc",
    },
    include: {
      doctor: true,
      // Opcionalmente podemos traernos info del turno original si fue reprogramado
      // Prisma no permite un self-relation include directo a menos que esté definido explícitamente en el schema con nombre de relación,
      // pero como guardamos el rescheduledFromId podemos mostrar "Reprogramado desde el turno ID: X".
      // Para mayor claridad de UI, podríamos traer la fecha del turno original haciendo una query adicional o mapeo,
      // pero con el ID ya podemos mostrar la trazabilidad requerida en el requerimiento.
    },
  });

  // Para enriquecer el historial, vamos a buscar las fechas de los turnos originales de los cuales estos provienen.
  const rescheduledIds = appointments
    .filter((a) => a.rescheduledFromId !== null)
    .map((a) => a.rescheduledFromId as string);

  let originalAppointments: Record<string, Date> = {};

  if (rescheduledIds.length > 0) {
    const originals = await prisma.appointment.findMany({
      where: { id: { in: rescheduledIds } },
      select: { id: true, startTime: true },
    });
    originalAppointments = originals.reduce((acc, curr) => {
      acc[curr.id] = curr.startTime;
      return acc;
    }, {} as Record<string, Date>);
  }

  return appointments.map((app) => ({
    ...app,
    rescheduledFromDate: app.rescheduledFromId ? originalAppointments[app.rescheduledFromId] : null,
  }));
}
