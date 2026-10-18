import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, BookOpen, Search } from "lucide-react";
import courseApi from "../api/courseApi";
import departmentApi from "../api/departmentApi";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import CourseForm from "../components/CourseForm";
import EmptyState from "../components/EmptyState";
import TableToolbar from "../components/TableToolbar";
import { useToast } from "../context/ToastContext";

export default function CoursesPage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
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
      const [c, d] = await Promise.all([courseApi.getAll(), departmentApi.getAll()]);
      setCourses(c);
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
  const visibleCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchWords) ||
      c.code.toLowerCase().includes(searchWords) ||
      departmentName(c.department_id).toLowerCase().includes(searchWords),
  );

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (course) => {
    setEditing(course);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editing) {
        await courseApi.update(editing.id, payload);
        toast.success(`"${payload.title}" updated.`);
      } else {
        await courseApi.create(payload);
        toast.success(`"${payload.title}" added to the catalog.`);
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
      await courseApi.remove(pendingDelete.id);
      toast.success(`"${pendingDelete.title}" removed.`);
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
        eyebrow="Registrar / Catalog"
        title="Courses"
        description="The course catalog offered across departments this term."
        action={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add course
          </button>
        }
      />

      <TableToolbar
        searchText={searchText}
        onSearchTextChange={setSearchText}
        placeholder="Search by title, code or department…"
        shownCount={visibleCourses.length}
        totalCount={courses.length}
        recordName="courses"
      />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-surface-raised rounded-lg animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Add a course once at least one department exists."
            action={
              <button className="btn-primary" onClick={openCreate}>
                <Plus size={16} /> Add course
              </button>
            }
          />
        ) : visibleCourses.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching courses"
            description="Try a different title, code or department, or clear the search box."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="eyebrow font-normal px-6 py-3.5">ID</th>
                  <th className="eyebrow font-normal px-6 py-3.5">Code</th>
                  <th className="eyebrow font-normal px-6 py-3.5">Title</th>
                  <th className="eyebrow font-normal px-6 py-3.5">Department</th>
                  <th className="eyebrow font-normal px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCourses.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-line last:border-0 hover:bg-surface-raised/50 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-mono text-muted">#{c.id}</td>
                    <td className="px-6 py-3.5 font-mono text-sage">{c.code}</td>
                    <td className="px-6 py-3.5 text-parchment font-medium">{c.title}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-gold/10 text-gold border border-gold/30 rounded-full px-2.5 py-1">
                        {departmentName(c.department_id)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          className="icon-btn"
                          onClick={() => openEdit(c)}
                          title="Edit course"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="icon-btn hover:!text-crimson"
                          onClick={() => setPendingDelete(c)}
                          title="Delete course"
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
        title={editing ? "Edit course" : "Add course"}
        accent="#4F8767"
      >
        <CourseForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          submitting={submitting}
        />
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove this course?"
        message={`This will permanently delete "${pendingDelete?.title}" and any enrollments referencing it may fail.`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        busy={deleting}
      />
    </div>
  );
}
