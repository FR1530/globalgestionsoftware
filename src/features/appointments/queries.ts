"use server";

import prisma from "@/lib/db/prisma";
import { addMinutes, isBefore } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { AppointmentStatus } from "@prisma/client";

const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || "America/Argentina/Mendoza";

export async function getAvailableSlots(doctorId: string, targetDateStr: string) {
  // targetDateStr en formato YYYY-MM-DD
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId, deletedAt: null },
    include: { availabilities: true },
  });

  if (!doctor) throw new Error("Médico no encontrado");

  // targetDate será tratado como el inicio del día en la zona horaria por defecto
  const targetDate = toDate(`${targetDateStr}T00:00:00`, { timeZone: DEFAULT_TIMEZONE });
  const dayOfWeek = targetDate.getDay();

  // Buscar si hay disponibilidad para este día de la semana
  const dayAvailabilities = doctor.availabilities.filter(a => a.dayOfWeek === dayOfWeek);

  if (dayAvailabilities.length === 0) return [];

  // Buscar todos los turnos activos de ese día para el médico
  // Para hacer esto, creamos rangos UTC de todo el día
  const endOfDay = addMinutes(targetDate, 24 * 60 - 1);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      deletedAt: null,
      status: {
        in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      },
      startTime: { gte: targetDate },
      endTime: { lte: endOfDay },
    },
    select: { startTime: true, endTime: true },
  });

  const slots: { start: Date; end: Date }[] = [];
  const duration = doctor.appointmentDurationMinutes;

  for (const avail of dayAvailabilities) {
    let currentSlotStart = toDate(`${targetDateStr}T${avail.startTime}:00`, { timeZone: DEFAULT_TIMEZONE });
    const availEnd = toDate(`${targetDateStr}T${avail.endTime}:00`, { timeZone: DEFAULT_TIMEZONE });

    while (isBefore(addMinutes(currentSlotStart, duration), availEnd) || addMinutes(currentSlotStart, duration).getTime() === availEnd.getTime()) {
      const currentSlotEnd = addMinutes(currentSlotStart, duration);

      // Chequear superposición
      const overlaps = existingAppointments.some(
        app => (currentSlotStart < app.endTime && currentSlotEnd > app.startTime)
      );

      // Chequear que el turno no sea en el pasado
      if (!overlaps && currentSlotStart > new Date()) {
        slots.push({
          start: currentSlotStart,
          end: currentSlotEnd,
        });
      }

      currentSlotStart = currentSlotEnd;
    }
  }

  return slots.map(slot => ({
    startTime: slot.start.toISOString(),
    endTime: slot.end.toISOString(),
    displayTime: formatInTimeZone(slot.start, DEFAULT_TIMEZONE, "HH:mm"),
  }));
}
