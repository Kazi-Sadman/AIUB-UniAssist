import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, GraduationCap, Search } from "lucide-react";
import studentApi from "../api/studentApi";
import departmentApi from "../api/departmentApi";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import StudentForm from "../components/StudentForm";
import EmptyState from "../components/EmptyState";
import TableToolbar from "../components/TableToolbar";
import { useToast } from "../context/ToastContext";

export default function StudentsPage() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([studentApi.getAll(), departmentApi.getAll()]);
      setStudents(s);
      setDepartments(d);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departmentName = (id) => departments.find((d) => d.department_id === id)?.name || "—";

  // Only the rows that match the search box are shown.
  const searchWords = searchText.trim().toLowerCase();
  const visibleStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchWords) ||
      s.email.toLowerCase().includes(searchWords) ||
      departmentName(s.department_id).toLowerCase().includes(searchWords),
  );

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (student) => {
    setEditing(student);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editing) {
        await studentApi.update(editing.student_id, payload);
        toast.success(`"${payload.name}" updated.`);
      } else {
        await studentApi.create(payload);
        toast.success(`"${payload.name}" enrolled in the directory.`);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await studentApi.remove(pendingDelete.student_id);
      toast.success(`"${pendingDelete.name}" removed.`);
      setPendingDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Registrar / Directory"
        title="Students"
        description="Every enrolled student, their contact record, and home department."
        action={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add student
          </button>
        }
      />

      <TableToolbar
        searchText={searchText}
        onSearchTextChange={setSearchText}
        placeholder="Search by name, email or department…"
        shownCount={visibleStudents.length}
        totalCount={students.length}
        recordName="students"
      />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-surface-raised rounded-lg animate-pulse" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No students yet"
            description="Add a student record once at least one department exists."
            action={
              <button className="btn-primary" onClick={openCreate}>
                <Plus size={16} /> Add student
              </button>
            }
          />
        ) : visibleStudents.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching students"
            description="Try a different name, email or department, or clear the search box."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="eyebrow font-normal px-6 py-3.5">ID</th>
                  <th className="eyebrow font-normal px-6 py-3.5">Name</th>
                  <th className="eyebrow font-normal px-6 py-3.5">Email</th>
                  <th className="eyebrow font-normal px-6 py-3.5">Department</th>
                  <th className="eyebrow font-normal px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleStudents.map((s) => (
                  <tr
                    key={s.student_id}
                    className="border-b border-line last:border-0 hover:bg-surface-raised/50 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-mono text-muted">#{s.student_id}</td>
                    <td className="px-6 py-3.5 text-parchment font-medium">{s.name}</td>
                    <td className="px-6 py-3.5 text-muted">{s.email}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-sky/10 text-sky border border-sky/30 rounded-full px-2.5 py-1">
                        {departmentName(s.department_id)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          className="icon-btn"
                          onClick={() => openEdit(s)}
                          title="Edit student"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="icon-btn hover:!text-crimson"
                          onClick={() => setPendingDelete(s)}
                          title="Delete student"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow={editing ? "Edit record" : "New record"}
        title={editing ? "Edit student" : "Add student"}
        accent="#3E7BA6"
      >
        <StudentForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          submitting={submitting}
        />
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove this student?"
        message={`This will permanently delete "${pendingDelete?.name}" and cannot be undone.`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        busy={deleting}
      />
    </div>
  );
}
