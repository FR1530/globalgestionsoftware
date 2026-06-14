"use client";

import { useState, useMemo } from "react";
import { Plus, Edit, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DoctorFormModal } from "@/components/doctors/DoctorFormModal";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type Availability = { dayOfWeek: number; startTime: string; endTime: string };
type Doctor = {
  id: string; firstName: string; lastName: string; specialty: string;
  appointmentDurationMinutes: number; availabilities: Availability[];
  userId: string; user: { id: string; email: string };
};

export function DoctorsPageClient({ doctors }: { doctors: Doctor[] }) {
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return doctors;
    return doctors.filter((d) =>
      `${d.firstName} ${d.lastName} ${d.specialty} ${d.user.email}`.toLowerCase().includes(q)
    );
  }, [doctors, search]);

  const openCreate = () => { setEditingDoctor(null); setShowModal(true); };
  const openEdit = (doctor: Doctor) => { setEditingDoctor(doctor); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingDoctor(null); };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Gestión de Médicos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {doctors.length} médico{doctors.length !== 1 ? "s" : ""} registrado{doctors.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Médico
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, apellido, especialidad o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        {search && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Especialidad</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Turno</th>
                <th className="px-6 py-4">Disponibilidad</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">
                      {search ? `Sin resultados para "${search}"` : "No hay médicos registrados."}
                    </p>
                    {!search && (
                      <button onClick={openCreate} className="mt-2 text-indigo-600 text-sm font-medium hover:underline">
                        Crear el primer médico
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium">Dr. {doc.firstName} {doc.lastName}</td>
                    <td className="px-6 py-4">{doc.specialty}</td>
                    <td className="px-6 py-4 text-slate-500">{doc.user.email}</td>
                    <td className="px-6 py-4">{doc.appointmentDurationMinutes} min</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {doc.availabilities.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">Sin horarios</span>
                        ) : (
                          doc.availabilities.map((a, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-medium">
                              {DAYS[a.dayOfWeek]} {a.startTime}–{a.endTime}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => openEdit(doc)}>
                        <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <DoctorFormModal
          editingDoctor={editingDoctor ? { ...editingDoctor } : null}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
