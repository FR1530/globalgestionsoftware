"use server";
import prisma from "@/lib/db/prisma";
import { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
  CONFIRMED: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

export async function doctorUpdateStatus(appointmentId: string, newStatus: AppointmentStatus) {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) throw new Error("Turno no encontrado.");
  const allowed = ALLOWED_TRANSITIONS[appointment.status] ?? [];
  if (!allowed.includes(newStatus)) throw new Error(`No se puede cambiar de ${appointment.status} a ${newStatus}.`);
  const result = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: newStatus },
  });
  revalidatePath("/dashboard/doctor/agenda");
  return result;
}

export async function doctorSaveMedicalNote(appointmentId: string, content: string) {
  const existing = await prisma.medicalNote.findUnique({ where: { appointmentId } });
  if (existing) {
    await prisma.medicalNote.update({ where: { appointmentId }, data: { content } });
  } else {
    await prisma.medicalNote.create({ data: { appointmentId, content } });
  }
  revalidatePath("/dashboard/doctor/agenda");
}
