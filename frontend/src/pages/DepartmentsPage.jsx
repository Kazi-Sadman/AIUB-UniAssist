import React, { useEffect, useState } from "react";
import { Plus, Trash2, Building2, Search } from "lucide-react";
import departmentApi from "../api/departmentApi";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import DepartmentForm from "../components/DepartmentForm";
import EmptyState from "../components/EmptyState";
import TableToolbar from "../components/TableToolbar";
import { useToast } from "../context/ToastContext";

export default function DepartmentsPage() {
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await departmentApi.getAll();
      setDepartments(data);
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

  // Only the rows that match the search box are shown.
  const searchWords = searchText.trim().toLowerCase();
  const visibleDepartments = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(searchWords) || String(d.department_id).includes(searchWords),
  );

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      await departmentApi.create(payload);
      toast.success(`"${payload.name}" added to the directory.`);
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
      await departmentApi.remove(pendingDelete.department_id);
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
        title="Departments"
        description="Academic departments that students belong to and courses are organized under."
        action={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add department
          </button>
        }
      />

      <TableToolbar
        searchText={searchText}
        onSearchTextChange={setSearchText}
        placeholder="Search departments…"
        shownCount={visibleDepartments.length}
        totalCount={departments.length}
        recordName="departments"
      />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-surface-raised rounded-lg animate-pulse" />
            ))}
          </div>
        ) : departments.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No departments yet"
            description="Departments anchor every student and course record. Add the first one to get started."
            action={
              <button className="btn-primary" onClick={() => setModalOpen(true)}>
                <Plus size={16} /> Add department
              </button>
            }
          />
        ) : visibleDepartments.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching departments"
            description="Try a different name or clear the search box."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="eyebrow font-normal px-6 py-3.5">ID</th>
                  <th className="eyebrow font-normal px-6 py-3.5">Name</th>
                  <th className="eyebrow font-normal px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleDepartments.map((d) => (
                  <tr
                    key={d.department_id}
                    className="border-b border-line last:border-0 hover:bg-surface-raised/50 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-mono text-muted">#{d.department_id}</td>
                    <td className="px-6 py-3.5 text-parchment font-medium">{d.name}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end">
                        <button
                          className="icon-btn hover:!text-crimson"
                          onClick={() => setPendingDelete(d)}
                          title="Delete department"
                        >
                          <Trash2 size={15} />
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
        eyebrow="New record"
        title="Add department"
        accent="#C9A227"
      >
        <DepartmentForm
          onSubmit={handleCreate}
          onCancel={() => setModalOpen(false)}
          submitting={submitting}
        />
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove this department?"
        message={`This will permanently delete "${pendingDelete?.name}". Students or courses referencing it may be affected.`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        busy={deleting}
      />
    </div>
  );
}
