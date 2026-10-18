import React, { useEffect, useState } from "react";
import { Plus, Trash2, ClipboardList, Search, ArrowRight } from "lucide-react";
import enrollmentApi from "../api/enrollmentApi";
import studentApi from "../api/studentApi";
import courseApi from "../api/courseApi";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import EnrollmentForm from "../components/EnrollmentForm";
import EmptyState from "../components/EmptyState";
import TableToolbar from "../components/TableToolbar";
import { useToast } from "../context/ToastContext";

export default function EnrollmentsPage() {
  const toast = useToast();
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Lookup panel state
  const [lookupMode, setLookupMode] = useState("byStudent"); // or "byCourse"
  const [lookupId, setLookupId] = useState("");
  const [lookupResults, setLookupResults] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [e, s, c] = await Promise.all([
        enrollmentApi.getAll(),
        studentApi.getAll(),
        courseApi.getAll(),
      ]);
      setEnrollments(e);
      setStudents(s);
      setCourses(c);
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

  const studentName = (id) => students.find((s) => s.student_id === id)?.name || `#${id}`;
  const courseLabel = (id) => {
    const c = courses.find((c) => c.id === id);
    return c ? `${c.code} — ${c.title}` : `#${id}`;
  };

  // Only the rows that match the search box are shown.
  const searchWords = searchText.trim().toLowerCase();
  const visibleEnrollments = enrollments.filter(
    (e) =>
      studentName(e.student_id).toLowerCase().includes(searchWords) ||
      courseLabel(e.course_id).toLowerCase().includes(searchWords) ||
      `sem ${e.semester}`.includes(searchWords),
  );

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      await enrollmentApi.create(payload);
      toast.success("Enrollment recorded.");
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
      await enrollmentApi.remove(pendingDelete.id);
      toast.success("Enrollment cancelled.");
      setPendingDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const runLookup = async () => {
    if (!lookupId) return;
    setLookupLoading(true);
    setLookupResults(null);
    try {
      const data =
        lookupMode === "byStudent"
          ? await enrollmentApi.getCoursesByStudent(lookupId)
          : await enrollmentApi.getStudentsByCourse(lookupId);
      setLookupResults(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Registrar / Enrollment"
        title="Enrollments"
        description="Links a student to a course for a given semester."
        action={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Enroll student
          </button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="min-w-0">
          <TableToolbar
            searchText={searchText}
            onSearchTextChange={setSearchText}
            placeholder="Search by student, course or semester…"
            shownCount={visibleEnrollments.length}
            totalCount={enrollments.length}
            recordName="enrollments"
          />
          <div className="card overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-surface-raised rounded-lg animate-pulse" />
                ))}
              </div>
            ) : enrollments.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No enrollments yet"
                description="Enroll a student in a course once students and courses exist."
                action={
                  <button className="btn-primary" onClick={() => setModalOpen(true)}>
                    <Plus size={16} /> Enroll student
                  </button>
                }
              />
            ) : visibleEnrollments.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No matching enrollments"
                description="Try a different student, course or semester, or clear the search box."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left">
                      <th className="eyebrow font-normal px-6 py-3.5">ID</th>
                      <th className="eyebrow font-normal px-6 py-3.5">Student</th>
                      <th className="eyebrow font-normal px-6 py-3.5">Course</th>
                      <th className="eyebrow font-normal px-6 py-3.5">Semester</th>
                      <th className="eyebrow font-normal px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEnrollments.map((e) => (
                      <tr
                        key={e.id}
                        className="border-b border-line last:border-0 hover:bg-surface-raised/50 transition-colors"
                      >
                        <td className="px-6 py-3.5 font-mono text-muted">#{e.id}</td>
                        <td className="px-6 py-3.5 text-parchment font-medium">
                          {studentName(e.student_id)}
                        </td>
                        <td className="px-6 py-3.5 text-muted">{courseLabel(e.course_id)}</td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center text-xs font-medium bg-crimson/10 text-crimson border border-crimson/30 rounded-full px-2.5 py-1">
                            Sem {e.semester}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex justify-end">
                            <button
                              className="icon-btn hover:!text-crimson"
                              onClick={() => setPendingDelete(e)}
                              title="Cancel enrollment"
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
        </div>

        <div className="card p-5">
          <p className="eyebrow mb-1">Quick lookup</p>
          <h3 className="font-display text-base font-semibold text-parchment mb-4">
            Cross-reference records
          </h3>

          <div className="flex gap-1.5 bg-ink border border-line rounded-lg p-1 mb-4">
            <button
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                lookupMode === "byStudent" ? "bg-surface-raised text-parchment" : "text-muted"
              }`}
              onClick={() => {
                setLookupMode("byStudent");
                setLookupResults(null);
                setLookupId("");
              }}
            >
              Courses by student
            </button>
            <button
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                lookupMode === "byCourse" ? "bg-surface-raised text-parchment" : "text-muted"
              }`}
              onClick={() => {
                setLookupMode("byCourse");
                setLookupResults(null);
                setLookupId("");
              }}
            >
              Students by course
            </button>
          </div>

          <label className="label-field">{lookupMode === "byStudent" ? "Student" : "Course"}</label>
          <div className="flex gap-2 mb-4">
            <select
              className="input-field"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
            >
              <option value="">Select…</option>
              {(lookupMode === "byStudent" ? students : courses).map((item) => (
                <option
                  key={lookupMode === "byStudent" ? item.student_id : item.id}
                  value={lookupMode === "byStudent" ? item.student_id : item.id}
                >
                  {lookupMode === "byStudent" ? item.name : `${item.code} — ${item.title}`}
                </option>
              ))}
            </select>
            <button
              className="icon-btn border border-line shrink-0"
              onClick={runLookup}
              title="Search"
            >
              <Search size={15} />
            </button>
          </div>

          <div className="space-y-2 min-h-[40px]">
            {lookupLoading && <div className="h-9 bg-surface-raised rounded-lg animate-pulse" />}
            {!lookupLoading && lookupResults?.length === 0 && (
              <p className="text-xs text-muted">No records found.</p>
            )}
            {!lookupLoading &&
              lookupResults?.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm bg-ink border border-line rounded-lg px-3 py-2"
                >
                  <ArrowRight size={13} className="text-muted shrink-0" />
                  <span className="text-parchment">
                    {lookupMode === "byStudent" ? `${item.code} — ${item.title}` : item.name}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow="New record"
        title="Enroll student"
        accent="#A6314A"
      >
        <EnrollmentForm
          onSubmit={handleCreate}
          onCancel={() => setModalOpen(false)}
          submitting={submitting}
        />
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Cancel this enrollment?"
        message={`This will remove enrollment #${pendingDelete?.id} for semester ${pendingDelete?.semester}.`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        busy={deleting}
      />
    </div>
  );
}
