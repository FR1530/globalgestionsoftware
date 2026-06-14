"use client";

import { useState, useMemo } from "react";
import { getAvailableSlots } from "@/features/appointments/queries";
import { createAppointment } from "@/features/appointments/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, ChevronRight, CalendarDays, FileText, User } from "lucide-react";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_NAMES_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type Availability = { dayOfWeek: number; startTime: string; endTime: string };
type Doctor = {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  appointmentDurationMinutes: number;
  availabilities: Availability[];
};

export function NewAppointmentForm({
  doctors,
  patientId,
}: {
  doctors: Doctor[];
  patientId: string;
}) {
  const router = useRouter();

  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<{ startTime: string; endTime: string; displayTime: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [slotsSearched, setSlotsSearched] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === selectedDoctorId) ?? null,
    [doctors, selectedDoctorId]
  );

  // Días de la semana en los que atiende el médico seleccionado
  const availableDays = useMemo(
    () => selectedDoctor
      ? [...new Set(selectedDoctor.availabilities.map((a) => a.dayOfWeek))].sort()
      : [],
    [selectedDoctor]
  );

  // Verificar si la fecha seleccionada es un día en que atiende el médico
  const selectedDateDayOfWeek = selectedDate ? new Date(selectedDate + "T12:00:00").getDay() : -1;
  const isDateValid = availableDays.includes(selectedDateDayOfWeek);

  const handleDoctorChange = (id: string) => {
    setSelectedDoctorId(id);
    setSelectedDate("");
    setSlots([]);
    setSelectedSlot("");
    setSlotsSearched(false);
    setError("");
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSlots([]);
    setSelectedSlot("");
    setSlotsSearched(false);
    setError("");
  };

  const handleSearchSlots = async () => {
    if (!selectedDoctorId || !selectedDate) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot("");
    setSlotsSearched(false);
    setError("");
    try {
      const available = await getAvailableSlots(selectedDoctorId, selectedDate);
      setSlots(available);
      setSlotsSearched(true);
    } catch {
      setError("Error al obtener horarios. Intentá nuevamente.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedSlot) return;
    setLoadingCreate(true);
    setError("");
    try {
      await createAppointment({
        patientId,
        doctorId: selectedDoctorId,
        startTime: new Date(selectedSlot),
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/patient/appointments");
        router.refresh();
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Error al crear el turno.");
    } finally {
      setLoadingCreate(false);
    }
  };

  const inputClass =
    "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow";

  if (success) {
    return (
      <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center animate-bounce">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">¡Turno reservado!</h2>
        <p className="text-sm text-slate-500">Redirigiendo a tus turnos...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6">
        <h2 className="text-white font-bold text-lg">Reservar turno</h2>
        <p className="text-indigo-200 text-sm mt-1">
          Elegí un médico y seleccioná el horario que mejor te quede
        </p>
      </div>

      <div className="p-6 space-y-6">

        {/* PASO 1: Médico */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 text-xs font-bold flex items-center justify-center">1</span>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-4 h-4" /> Elegí un médico
            </label>
          </div>

          <select
            value={selectedDoctorId}
            onChange={(e) => handleDoctorChange(e.target.value)}
            className={inputClass}
          >
            <option value="">Seleccionar médico...</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.firstName} {d.lastName} — {d.specialty}
              </option>
            ))}
          </select>

          {/* Ficha del médico seleccionado */}
          {selectedDoctor && (
            <div className="mt-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  </p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                    {selectedDoctor.specialty}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Duración del turno: <span className="font-medium">{selectedDoctor.appointmentDurationMinutes} min</span>
                  </p>
                </div>
              </div>

              {/* Días que atiende */}
              {availableDays.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500 mb-2">Días que atiende:</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                      const isAvailable = availableDays.includes(day);
                      const daySlots = selectedDoctor.availabilities.filter(a => a.dayOfWeek === day);
                      return (
                        <div
                          key={day}
                          title={isAvailable ? daySlots.map(s => `${s.startTime}–${s.endTime}`).join(", ") : "No atiende"}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-default ${
                            isAvailable
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600"
                          }`}
                        >
                          {DAY_NAMES[day]}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Horarios: {selectedDoctor.availabilities.map(a =>
                      `${DAY_NAMES[a.dayOfWeek]} ${a.startTime}–${a.endTime}`
                    ).join(" · ")}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                  ⚠️ Este médico aún no tiene horarios de atención configurados.
                </p>
              )}
            </div>
          )}
        </div>

        {/* PASO 2: Fecha (solo si hay médico con disponibilidades) */}
        {selectedDoctor && availableDays.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 text-xs font-bold flex items-center justify-center">2</span>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" /> Seleccioná una fecha
              </label>
            </div>

            <div className="flex gap-3">
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => handleDateChange(e.target.value)}
                className={`${inputClass} flex-1`}
              />
              <Button
                onClick={handleSearchSlots}
                disabled={!selectedDate || !isDateValid || loadingSlots}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
              >
                {loadingSlots ? "Buscando..." : "Ver horarios"}
                {!loadingSlots && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>

            {/* Aviso de día no disponible */}
            {selectedDate && !isDateValid && (
              <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                El Dr. {selectedDoctor.lastName} no atiende los <strong>{DAY_NAMES_FULL[selectedDateDayOfWeek]}</strong>.
                Atiende los: {availableDays.map(d => DAY_NAMES_FULL[d]).join(", ")}.
              </div>
            )}

            {/* Slots de horario */}
            {slotsSearched && (
              <div className="mt-4">
                {slots.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Sin horarios disponibles para esta fecha.</p>
                    <p className="text-xs text-slate-400 mt-1">Todos los turnos de este día ya están ocupados. Probá con otra fecha.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {slots.length} horario{slots.length !== 1 ? "s" : ""} disponible{slots.length !== 1 ? "s" : ""} — seleccioná uno:
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
          </div>
        )}

        {/* PASO 3: Notas (solo si hay horario seleccionado) */}
        {selectedSlot && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 text-xs font-bold flex items-center justify-center">3</span>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Motivo de consulta
                <span className="text-xs font-normal text-slate-400">(opcional)</span>
              </label>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: dolor de cabeza frecuente, control anual, revisión de medicación..."
              rows={3}
              maxLength={500}
              className={`${inputClass} resize-none`}
            />
            <p className="text-xs text-slate-400 text-right mt-1">{notes.length}/500</p>
          </div>
        )}

        {/* Resumen */}
        {selectedSlot && selectedDoctor && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-1.5 text-sm">
            <p className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2">Resumen del turno</p>
            <p className="text-slate-700 dark:text-slate-300">
              👨‍⚕️ <span className="font-medium">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</span>
              <span className="text-slate-500"> · {selectedDoctor.specialty}</span>
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              📅 <span className="font-medium">{selectedDate}</span>
              {" "}a las{" "}
              <span className="font-medium">{slots.find(s => s.startTime === selectedSlot)?.displayTime}</span>
            </p>
            {notes && (
              <p className="text-slate-500 italic text-xs">
                📝 "{notes.substring(0, 80)}{notes.length > 80 ? "..." : ""}"
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {selectedSlot && (
          <Button
            onClick={handleCreate}
            disabled={loadingCreate}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-base font-semibold"
          >
            {loadingCreate ? "Reservando..." : "Confirmar Reserva"}
          </Button>
        )}
      </div>
    </div>
  );
}
