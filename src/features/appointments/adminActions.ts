"use server";

import prisma from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "@prisma/client";
import { addMinutes } from "date-fns";

export async function adminCreateAppointment(data: {
  patientId: string;
  doctorId: string;
  startTime: string; // ISO string
  status?: AppointmentStatus;
}) {
  const startTime = new Date(data.startTime);

  return await prisma.$transaction(async (tx) => {
    const doctor = await tx.doctor.findUnique({ where: { id: data.doctorId } });
    if (!doctor) throw new Error("Médico no encontrado.");

    const endTime = addMinutes(startTime, doctor.appointmentDurationMinutes);

    const overlapping = await tx.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        deletedAt: null,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    });

    if (overlapping) throw new Error("El horario elegido ya está ocupado por otro turno activo.");

    const appointment = await tx.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        startTime,
        endTime,
        status: data.status ?? AppointmentStatus.PENDING,
      },
    });

    revalidatePath("/dashboard/admin/appointments");
    return appointment;
  });
}

export async function adminUpdateAppointment(id: string, data: {
  patientId: string;
  doctorId: string;
  startTime: string;
  status: AppointmentStatus;
}) {
  const startTime = new Date(data.startTime);

  const doctor = await prisma.doctor.findUnique({ where: { id: data.doctorId } });
  if (!doctor) throw new Error("Médico no encontrado.");
  const endTime = addMinutes(startTime, doctor.appointmentDurationMinutes);

  // Verificar solapamiento excluyendo el mismo turno
  const overlapping = await prisma.appointment.findFirst({
    where: {
      id: { not: id },
      doctorId: data.doctorId,
      deletedAt: null,
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    },
  });

  if (overlapping) throw new Error("El horario elegido ya está ocupado por otro turno activo.");

  const result = await prisma.appointment.update({
    where: { id },
    data: { patientId: data.patientId, doctorId: data.doctorId, startTime, endTime, status: data.status },
  });

  revalidatePath("/dashboard/admin/appointments");
  return result;
}

export async function adminDeleteAppointment(id: string) {
  await prisma.appointment.update({
    where: { id },
    data: { deletedAt: new Date(), status: AppointmentStatus.CANCELLED },
  });
  revalidatePath("/dashboard/admin/appointments");
}
