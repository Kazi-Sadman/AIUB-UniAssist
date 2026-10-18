import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Building2, GraduationCap, BookOpen, ClipboardList } from "lucide-react";
import departmentApi from "../api/departmentApi";
import studentApi from "../api/studentApi";
import courseApi from "../api/courseApi";
import enrollmentApi from "../api/enrollmentApi";
import PageHeader from "../components/PageHeader";
import { useToast } from "../context/ToastContext";

const MAX_RESULTS_PER_GROUP = 6;

// True when `value` contains `searchWords` (ignores upper/lower case).
function containsText(value, searchWords) {
  return String(value ?? "")
    .toLowerCase()
    .includes(searchWords);
}

export default function GlobalSearchPage() {
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  // Search runs in the browser over data from the existing list endpoints,
  // so no new backend endpoint is needed.
  useEffect(() => {
    Promise.all([
      departmentApi.getAll(),
      studentApi.getAll(),
      courseApi.getAll(),
      enrollmentApi.getAll(),
    ])
      .then(([departmentList, studentList, courseList, enrollmentList]) => {
        setDepartments(departmentList);
        setStudents(studentList);
        setCourses(courseList);
        setEnrollments(enrollmentList);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchWords = searchText.trim().toLowerCase();

  const findStudentName = (id) =>
    students.find((s) => s.student_id === id)?.name || `Student #${id}`;
  const findCourseLabel = (id) => {
    const course = courses.find((c) => c.id === id);
    return course ? `${course.code} — ${course.title}` : `Course #${id}`;
  };

  // Each group lists what matched, as { key, title, detail } rows.
  const resultGroups = searchWords
    ? [
        {
          name: "Departments",
          to: "/departments",
          icon: Building2,
          accent: "#C9A227",
          rows: departments
            .filter((d) => containsText(d.name, searchWords))
            .map((d) => ({
              key: d.department_id,
              title: d.name,
              detail: `Department #${d.department_id}`,
            })),
        },
        {
          name: "Students",
          to: "/students",
          icon: GraduationCap,
          accent: "#3E7BA6",
          rows: students
            .filter((s) => containsText(s.name, searchWords) || containsText(s.email, searchWords))
            .map((s) => ({ key: s.student_id, title: s.name, detail: s.email })),
        },
        {
          name: "Courses",
          to: "/courses",
          icon: BookOpen,
          accent: "#4F8767",
          rows: courses
            .filter((c) => containsText(c.title, searchWords) || containsText(c.code, searchWords))
            .map((c) => ({ key: c.id, title: c.title, detail: c.code })),
        },
        {
          name: "Enrollments",
          to: "/enrollments",
          icon: ClipboardList,
          accent: "#A6314A",
          rows: enrollments
            .filter(
              (e) =>
                containsText(findStudentName(e.student_id), searchWords) ||
                containsText(findCourseLabel(e.course_id), searchWords),
            )
            .map((e) => ({
              key: e.id,
              title: findStudentName(e.student_id),
              detail: `${findCourseLabel(e.course_id)} · Semester ${e.semester}`,
            })),
        },
      ]
    : [];

  const totalMatches = resultGroups.reduce((sum, group) => sum + group.rows.length, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Tools / Search"
        title="Global search"
        description="Find a department, student, course or enrollment from one place."
      />

      <div className="relative max-w-xl mb-8">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          type="text"
          className="input-field !pl-10 !py-3"
          placeholder="Search names, emails, course codes…"
          aria-label="Search all records"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          disabled={isLoading}
          autoFocus
        />
      </div>

      {isLoading ? (
        <div className="space-y-3 max-w-xl">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-surface-raised rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !searchWords ? (
        <p className="text-sm text-muted">
          Searching {departments.length} departments, {students.length} students, {courses.length}{" "}
          courses and {enrollments.length} enrollments.
        </p>
      ) : totalMatches === 0 ? (
        <p className="text-sm text-muted">
          Nothing matches &ldquo;{searchText.trim()}&rdquo;. Try a shorter word.
        </p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {resultGroups
            .filter((group) => group.rows.length > 0)
            .map(({ name, to, icon: Icon, accent, rows }) => (
              <section key={name} className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-7 h-7 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: `${accent}1A`, color: accent }}
                    >
                      <Icon size={14} />
                    </span>
                    <h2 className="font-display text-base font-semibold text-parchment">
                      {name} <span className="text-muted font-body text-sm">({rows.length})</span>
                    </h2>
                  </div>
                  <Link to={to} className="text-xs font-medium text-gold hover:text-gold-glow">
                    Open page
                  </Link>
                </div>
                <ul>
                  {rows.slice(0, MAX_RESULTS_PER_GROUP).map((row) => (
                    <li key={row.key} className="px-5 py-3 border-b border-line last:border-0">
                      <p className="text-sm font-medium text-parchment">{row.title}</p>
                      <p className="text-xs text-muted">{row.detail}</p>
                    </li>
                  ))}
                </ul>
                {rows.length > MAX_RESULTS_PER_GROUP && (
                  <p className="px-5 py-3 text-xs text-muted border-t border-line">
                    {rows.length - MAX_RESULTS_PER_GROUP} more on the {name.toLowerCase()} page.
                  </p>
                )}
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
