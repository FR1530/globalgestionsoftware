import { describe, it, expect } from 'vitest';
import { DoctorAvailabilitiesSchema } from '@/schemas/doctor';

describe('Zod Validations - Doctor Availability', () => {
  it('debería rechazar franjas donde startTime no sea menor a endTime', () => {
    const data = [
      { dayOfWeek: 1, startTime: '15:00', endTime: '12:00' }
    ];
    const result = DoctorAvailabilitiesSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(JSON.stringify(result.error.issues)).toContain("La hora de inicio debe ser anterior a la hora de fin");
    }
  });

  it('debería rechazar franjas que se solapen en el mismo día', () => {
    const data = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: 1, startTime: '12:00', endTime: '15:00' } // solapa
    ];
    const result = DoctorAvailabilitiesSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(JSON.stringify(result.error.issues)).toContain("No puede haber franjas horarias superpuestas en el mismo día");
    }
  });

  it('debería aceptar franjas correctas y sin solapamiento', () => {
    const data = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: 1, startTime: '13:00', endTime: '17:00' }
    ];
    const result = DoctorAvailabilitiesSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

