import { z } from "zod";

export const AvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:mm requerido"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:mm requerido"),
}).refine((data) => {
  return data.startTime < data.endTime;
}, {
  message: "La hora de inicio debe ser anterior a la hora de fin",
  path: ["startTime"],
});

export const DoctorAvailabilitiesSchema = z.array(AvailabilitySchema).refine(
  (availabilities) => {
    // Verificar solapamiento para el mismo día
    const byDay = availabilities.reduce((acc, curr) => {
      if (!acc[curr.dayOfWeek]) acc[curr.dayOfWeek] = [];
      acc[curr.dayOfWeek].push(curr);
      return acc;
    }, {} as Record<number, { startTime: string; endTime: string }[]>);

    for (const day in byDay) {
      const slots = byDay[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 0; i < slots.length - 1; i++) {
        if (slots[i].endTime > slots[i + 1].startTime) {
          return false; // Hay solapamiento
        }
      }
    }
    return true;
  },
  {
    message: "No puede haber franjas horarias superpuestas en el mismo día",
  }
);

export const CreateDoctorSchema = z.object({
  userId: z.string().min(1, "El usuario es requerido"),
  firstName: z.string().min(2, "Mínimo 2 caracteres"),
  lastName: z.string().min(2, "Mínimo 2 caracteres"),
  specialty: z.string().min(2, "Mínimo 2 caracteres"),
  appointmentDurationMinutes: z.number().int().min(5),
  availabilities: DoctorAvailabilitiesSchema,
});
