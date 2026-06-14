import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cancelAppointment, createAppointment, rescheduleAppointment } from '@/features/appointments/actions';
import prisma from '@/lib/db/prisma';
import { AppointmentStatus } from '@prisma/client';
import { addMinutes } from 'date-fns';

// Mockear next/cache para que revalidatePath no explote fuera del contexto de Next.js
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

vi.mock('@/lib/db/prisma', () => {
  return {
    default: {
      $transaction: vi.fn(async (callback) => {
        return await callback(prisma);
      }),
      appointment: {
        findUnique: vi.fn(),
        update: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      doctor: {
        findUnique: vi.fn(),
      }
    },
  };
});

describe('Appointments Business Rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAppointment (Solapamiento)', () => {
    it('debería rechazar si existe un turno solapado', async () => {
      (prisma.doctor.findUnique as any).mockResolvedValue({ id: 'doc1', appointmentDurationMinutes: 30 });
      (prisma.appointment.findFirst as any).mockResolvedValue({ id: 'app1' }); // Hay solapamiento

      await expect(createAppointment({
        patientId: 'pat1',
        doctorId: 'doc1',
        startTime: new Date(),
      })).rejects.toThrow('El horario seleccionado ya no está disponible.');
    });

    it('debería crear el turno si no hay solapamiento', async () => {
      (prisma.doctor.findUnique as any).mockResolvedValue({ id: 'doc1', appointmentDurationMinutes: 30 });
      (prisma.appointment.findFirst as any).mockResolvedValue(null); // NO hay solapamiento
      (prisma.appointment.create as any).mockResolvedValue({ id: 'app2', status: AppointmentStatus.PENDING });

      const res = await createAppointment({
        patientId: 'pat1',
        doctorId: 'doc1',
        startTime: new Date(),
      });

      expect(prisma.appointment.create).toHaveBeenCalled();
      expect(res.status).toBe(AppointmentStatus.PENDING);
    });
  });

  describe('cancelAppointment', () => {
    it('debería fallar si faltan menos de 2 horas', async () => {
      const mockAppointment = {
        id: '123',
        status: AppointmentStatus.PENDING,
        deletedAt: null,
        startTime: addMinutes(new Date(), 60), 
      };
      (prisma.appointment.findUnique as any).mockResolvedValue(mockAppointment);
      await expect(cancelAppointment('123', 2)).rejects.toThrow(/al menos 2 horas/);
    });

    it('debería permitir cancelar si faltan más de 2 horas', async () => {
      const mockAppointment = {
        id: '123',
        status: AppointmentStatus.PENDING,
        deletedAt: null,
        startTime: addMinutes(new Date(), 180),
      };
      (prisma.appointment.findUnique as any).mockResolvedValue(mockAppointment);
      (prisma.appointment.update as any).mockResolvedValue({ ...mockAppointment, status: AppointmentStatus.CANCELLED });
      
      const result = await cancelAppointment('123', 2);
      expect(result.status).toBe(AppointmentStatus.CANCELLED);
    });
  });

  describe('rescheduleAppointment', () => {
    it('debería cancelar el original y crear uno nuevo apuntando al original', async () => {
      const originalApp = {
        id: 'old1',
        doctorId: 'doc1',
        patientId: 'pat1',
        deletedAt: null,
        status: AppointmentStatus.PENDING,
        doctor: { appointmentDurationMinutes: 30 }
      };

      (prisma.appointment.findUnique as any).mockResolvedValue(originalApp);
      (prisma.appointment.findFirst as any).mockResolvedValue(null); // sin solapamiento nuevo
      (prisma.appointment.update as any).mockResolvedValue({ ...originalApp, status: AppointmentStatus.CANCELLED });
      (prisma.appointment.create as any).mockResolvedValue({ id: 'new1', rescheduledFromId: 'old1' });

      const res = await rescheduleAppointment({
        appointmentId: 'old1',
        newStartTime: addMinutes(new Date(), 300)
      });

      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'old1' },
        data: { status: AppointmentStatus.CANCELLED }
      });
      expect(prisma.appointment.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ rescheduledFromId: 'old1' })
      }));
    });
  });
});
