import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateAppointmentStatus } from '@/features/appointments/actions';
import prisma from '@/lib/db/prisma';
import { AppointmentStatus } from '@prisma/client';

vi.mock('@/lib/db/prisma', () => {
  return {
    default: {
      appointment: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

describe('Appointments Status Transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMock = (currentStatus: AppointmentStatus) => {
    (prisma.appointment.findUnique as any).mockResolvedValue({
      id: '1',
      status: currentStatus,
    });
    (prisma.appointment.update as any).mockImplementation((args: any) => Promise.resolve({
      id: '1',
      status: args.data.status,
    }));
  };

  it('permite transición de PENDING a CONFIRMED', async () => {
    setupMock(AppointmentStatus.PENDING);
    const res = await updateAppointmentStatus('1', AppointmentStatus.CONFIRMED);
    expect(res.status).toBe(AppointmentStatus.CONFIRMED);
  });

  it('permite transición de CONFIRMED a COMPLETED', async () => {
    setupMock(AppointmentStatus.CONFIRMED);
    const res = await updateAppointmentStatus('1', AppointmentStatus.COMPLETED);
    expect(res.status).toBe(AppointmentStatus.COMPLETED);
  });

  it('permite transición de PENDING a CANCELLED', async () => {
    setupMock(AppointmentStatus.PENDING);
    const res = await updateAppointmentStatus('1', AppointmentStatus.CANCELLED);
    expect(res.status).toBe(AppointmentStatus.CANCELLED);
  });

  it('permite transición de CONFIRMED a CANCELLED', async () => {
    setupMock(AppointmentStatus.CONFIRMED);
    const res = await updateAppointmentStatus('1', AppointmentStatus.CANCELLED);
    expect(res.status).toBe(AppointmentStatus.CANCELLED);
  });

  it('rechaza transición de COMPLETED a CANCELLED', async () => {
    setupMock(AppointmentStatus.COMPLETED);
    await expect(updateAppointmentStatus('1', AppointmentStatus.CANCELLED))
      .rejects.toThrowError('Transición no permitida: de COMPLETED a CANCELLED');
  });

  it('rechaza transición de CANCELLED a PENDING', async () => {
    setupMock(AppointmentStatus.CANCELLED);
    await expect(updateAppointmentStatus('1', AppointmentStatus.PENDING))
      .rejects.toThrowError('Transición no permitida: de CANCELLED a PENDING');
  });

  it('rechaza transición de PENDING a COMPLETED', async () => {
    setupMock(AppointmentStatus.PENDING);
    await expect(updateAppointmentStatus('1', AppointmentStatus.COMPLETED))
      .rejects.toThrowError('Transición no permitida: de PENDING a COMPLETED');
  });
});
