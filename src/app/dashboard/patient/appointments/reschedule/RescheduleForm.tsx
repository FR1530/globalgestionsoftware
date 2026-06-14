"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAvailableSlots } from "@/features/appointments/queries";
import { rescheduleAppointment } from "@/features/appointments/actions";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, CalendarDays, ChevronRight, CheckCircle, AlertTriangle } from "lucide-react";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_NAMES_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type Availability = { dayOfWeek: number; startTime: string; endTime: string };
type Props = {
  appointment: {
    id: string;
    startTime: string;
    doctor: {
      id: string;
      firstName: string;
      lastName: string;
      specialty: string;
      appointmentDurationMinutes: number;
      availabilities: Availability[];
    };
  };
};

export function RescheduleForm({ appointment }: Props) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<{ startTime: string; endTime: string; displayTime: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [slotsSearched, setSlotsSearched] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const availableDays = useMemo(
    () => [...new Set(appointment.doctor.availabilities.map((a) => a.dayOfWeek))].sort(),
    [appointment.doctor.availabilities]
  );

  const selectedDayOfWeek = selectedDate ? new Date(selectedDate + "T12:00:00").getDay() : -1;
  const isDateValid = availableDays.includes(selectedDayOfWeek);

  const handleSearch = async () => {
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot("");
    setSlotsSearched(false);
    setError("");
    try {
      const available = await getAvailableSlots(appointment.doctor.id, selectedDate);
      setSlots(available);
      setSlotsSearched(true);
    } catch {
      setError("Error al buscar horarios. Intentá nuevamente.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setLoadingConfirm(true);
    setError("");
    try {
      await rescheduleAppointment({
        appointmentId: appointment.id,
        newStartTime: new Date(selectedSlot),
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/patient/appointments");
        router.refresh();
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Error al reprogramar el turno.");
    } finally {
      setLoadingConfirm(false);
    }
  };

  const inputClass =
    "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none";

  if (success) {
    return (
      <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">¡Turno reprogramado!</h2>
        <p className="text-sm text-slate-500">Redirigiendo a tus turnos...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      {/* Turno actual */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-300">Turno actual a reprogramar</p>
          <p className="text-amber-700 dark:text-amber-400 mt-0.5">
            Dr. {appointment.doctor.firstName} {appointment.doctor.lastName} ·{" "}
            {format(new Date(appointment.startTime), "EEEE dd 'de' MMMM 'a las' HH:mm", { locale: es })}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Info del médico */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">{appointment.doctor.specialty}</p>
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <span
                key={day}
                className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                  availableDays.includes(day)
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                }`}
              >
                {DAY_NAMES[day]}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {appointment.doctor.availabilities
              .map((a) => `${DAY_NAMES[a.dayOfWeek]} ${a.startTime}–${a.endTime}`)
              .join(" · ")}
          </p>
        </div>

        {/* Selección de nueva fecha */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Nueva fecha
          </label>
          <div className="flex gap-3">
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSlots([]);
                setSelectedSlot("");
                setSlotsSearched(false);
              }}
              className={`${inputClass} flex-1`}
            />
            <Button
              onClick={handleSearch}
              disabled={!selectedDate || !isDateValid || loadingSlots}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
            >
              {loadingSlots ? "Buscando..." : "Ver horarios"}
              {!loadingSlots && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>

          {selectedDate && !isDateValid && (
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mt-2">
              El Dr. {appointment.doctor.lastName} no atiende los{" "}
              <strong>{DAY_NAMES_FULL[selectedDayOfWeek]}</strong>. Atiende los:{" "}
              {availableDays.map((d) => DAY_NAMES_FULL[d]).join(", ")}.
            </p>
          )}
        </div>

        {/* Slots */}
        {slotsSearched && (
          <div>
            {slots.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Sin horarios disponibles para esta fecha.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 mb-3">
                  {slots.length} horario{slots.length !== 1 ? "s" : ""} disponible{slots.length !== 1 ? "s" : ""}:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.startTime}
                      onClick={() => setSelectedSlot(slot.startTime)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all border ${
                        selectedSlot === slot.startTime
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {slot.displayTime}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Resumen */}
        {selectedSlot && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-sm">
            <p className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Nuevo turno</p>
            <p className="text-slate-700 dark:text-slate-300">
              📅{" "}
              {format(new Date(selectedDate + "T12:00:00"), "EEEE dd 'de' MMMM", { locale: es })} a las{" "}
              <span className="font-semibold">
                {slots.find((s) => s.startTime === selectedSlot)?.displayTime}
              </span>
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/patient/appointments")}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSlot || loadingConfirm}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loadingConfirm ? "Reprogramando..." : "Confirmar Reprogramación"}
          </Button>
        </div>
      </div>
    </div>
  );
}
