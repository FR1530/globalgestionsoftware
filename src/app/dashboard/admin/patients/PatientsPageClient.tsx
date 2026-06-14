"use client";

import { useState, useMemo } from "react";
import { Plus, Edit, Trash2, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PatientFormModal } from "@/components/patients/PatientFormModal";
import { deletePatient } from "@/features/patients/mutations";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  birthDate?: string | null;
  createdAt: string;
  user: { email: string };
};

export function PatientsPageClient({ patients }: { patients: Patient[] }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter((p) =>
      `${p.firstName} ${p.lastName} ${p.user.email} ${p.phone ?? ""}`.toLowerCase().includes(q)
    );
  }, [patients, search]);

  const openCreate = () => { setEditingPatient(null); setShowModal(true); };
  const openEdit = (p: Patient) => { setEditingPatient(p); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingPatient(null); };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Confirmas dar de baja a este paciente? La acción es reversible.")) return;
    setDeletingId(id);
    try {
      await deletePatient(id);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Gestión de Pacientes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {patients.length} paciente{patients.length !== 1 ? "s" : ""} registrado{patients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Paciente
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, apellido, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none"
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
                <th className="px-6 py-4">Nombre y Apellido</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4">Nacimiento</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">
                      {search ? `Sin resultados para "${search}"` : "No hay pacientes registrados."}
                    </p>
                    {!search && (
                      <button onClick={openCreate} className="mt-2 text-emerald-600 text-sm font-medium hover:underline">
                        Registrar el primer paciente
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{p.firstName} {p.lastName}</td>
                    <td className="px-6 py-4 text-slate-500">{p.user.email}</td>
                    <td className="px-6 py-4">{p.phone ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-6 py-4">
                      {p.birthDate
                        ? format(new Date(p.birthDate), "dd/MM/yyyy", { locale: es })
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                          <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === p.id}
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          {deletingId === p.id ? "..." : "Baja"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <PatientFormModal
          editingPatient={
            editingPatient
              ? { ...editingPatient, email: editingPatient.user.email }
              : null
          }
          onClose={closeModal}
        />
      )}
    </div>
  );
}
