"use server";

import prisma from "@/lib/db/prisma";
import { AppointmentStatus } from "@prisma/client";
import { addMinutes, isBefore } from "date-fns";
import { revalidatePath } from "next/cache";

export async function createAppointment({
  patientId,
  doctorId,
  startTime,
  notes,
}: {
  patientId: string;
  doctorId: string;
  startTime: Date;
  notes?: string;
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Obtener duración del turno del médico
    const doctor = await tx.doctor.findUnique({
      where: { id: doctorId, deletedAt: null },
    });

    if (!doctor) {
      throw new Error("Médico no encontrado o inactivo");
    }

    const endTime = addMinutes(startTime, doctor.appointmentDurationMinutes);

    // 2. Verificar solapamiento
    // No puede existir un turno que se solape (startTime < new.endTime AND endTime > new.startTime)
    // excluyendo turnos cancelados/completados y soft deleted
    const overlapping = await tx.appointment.findFirst({
      where: {
        doctorId,
        deletedAt: null,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });

    if (overlapping) {
      throw new Error("El horario seleccionado ya no está disponible.");
    }

    // 3. Crear el turno
    const appointment = await tx.appointment.create({
      data: {
        patientId,
        doctorId,
        startTime,
        endTime,
        status: AppointmentStatus.PENDING,
        notes: notes ?? null,
      },
    });

    return appointment;
  });
}

export async function cancelAppointment(appointmentId: string, minHoursToCancel: number = 2) {
  return await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment || appointment.deletedAt) {
      throw new Error("Turno no encontrado");
    }

    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      throw new Error("El turno no puede ser cancelado en su estado actual");
    }

    // Verificar límite de tiempo
    const now = new Date();
    const limitDate = addMinutes(now, minHoursToCancel * 60);

    if (isBefore(appointment.startTime, limitDate)) {
      throw new Error(`Los turnos deben cancelarse con al menos ${minHoursToCancel} horas de anticipación.`);
    }

    const result = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CANCELLED },
    });

    revalidatePath("/dashboard/patient/appointments");
    revalidatePath("/dashboard/admin/appointments");
    return result;
  });
}

export async function rescheduleAppointment({
  appointmentId,
  newStartTime,
}: {
  appointmentId: string;
  newStartTime: Date;
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Buscamos el turno original
    const original = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true },
    });

    if (!original) throw new Error("Turno no encontrado");

    // 2. Verificamos que se pueda reprogramar (ej: no cancelado)
    if (original.status === AppointmentStatus.CANCELLED || original.status === AppointmentStatus.COMPLETED) {
      throw new Error("El turno no puede ser reprogramado en su estado actual");
    }

    const duration = original.doctor.appointmentDurationMinutes;
    const newEndTime = addMinutes(newStartTime, duration);

    // 3. Verificamos solapamiento para el nuevo horario
    const overlap = await tx.appointment.findFirst({
      where: {
        doctorId: original.doctorId,
        deletedAt: null,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        OR: [
          { startTime: { lt: newEndTime }, endTime: { gt: newStartTime } }
        ]
      }
    });

    if (overlap) {
      throw new Error("El nuevo horario seleccionado no está disponible");
    }

    // 4. Cancelamos el original
    await tx.appointment.update({
      where: { id: original.id },
      data: { status: AppointmentStatus.CANCELLED },
    });

    // 5. Creamos el nuevo apuntando al original
    const rescheduled = await tx.appointment.create({
      data: {
        patientId: original.patientId,
        doctorId: original.doctorId,
        startTime: newStartTime,
        endTime: newEndTime,
        status: AppointmentStatus.PENDING,
        rescheduledFromId: original.id,
      },
    });

    return rescheduled;
  });
}

// Mapa de transiciones permitidas
const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
  CONFIRMED: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

export async function updateAppointmentStatus(id: string, newStatus: AppointmentStatus) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) throw new Error("Turno no encontrado");

  const currentStatus = appointment.status;
  
  if (currentStatus === newStatus) {
    return appointment;
  }

  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Transición no permitida: de ${currentStatus} a ${newStatus}`);
  }

  return await prisma.appointment.update({
    where: { id },
    data: { status: newStatus },
  });
}
