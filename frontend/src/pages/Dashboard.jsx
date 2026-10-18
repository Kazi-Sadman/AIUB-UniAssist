import React, { useEffect, useState } from "react";
import {
  Building2,
  GraduationCap,
  BookOpen,
  ClipboardList,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import departmentApi from "../api/departmentApi";
import studentApi from "../api/studentApi";
import courseApi from "../api/courseApi";
import enrollmentApi from "../api/enrollmentApi";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { useToast } from "../context/ToastContext";

const RECENT_ENROLLMENT_COUNT = 5;

export default function Dashboard() {
  const toast = useToast();
  const [data, setData] = useState({ departments: [], students: [], courses: [], enrollments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      departmentApi.getAll(),
      studentApi.getAll(),
      courseApi.getAll(),
      enrollmentApi.getAll(),
    ])
      .then(([departments, students, courses, enrollments]) => {
        if (!mounted) return;
        setData({ departments, students, courses, enrollments });
      })
      .catch((err) => toast.error(err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const perDepartment = data.departments.map((d) => ({
    ...d,
    studentCount: data.students.filter((s) => s.department_id === d.department_id).length,
    courseCount: data.courses.filter((c) => c.department_id === d.department_id).length,
  }));

  // The longest bar in the table is the department with the most students.
  const largestStudentCount = Math.max(1, ...perDepartment.map((d) => d.studentCount));

  // Newest enrollments first (higher id = created later).
  const recentEnrollments = [...data.enrollments]
    .sort((a, b) => b.id - a.id)
    .slice(0, RECENT_ENROLLMENT_COUNT);

  const findStudentName = (id) =>
    data.students.find((s) => s.student_id === id)?.name || `Student #${id}`;
  const findCourseLabel = (id) => {
    const course = data.courses.find((c) => c.id === id);
    return course ? `${course.code} — ${course.title}` : `Course #${id}`;
  };

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      <PageHeader
        eyebrow={today}
        title="Term overview"
        description="A live snapshot of the university's records, pulled straight from the API."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Departments"
          value={data.departments.length}
          icon={Building2}
          accent="#C9A227"
          loading={loading}
        />
        <StatCard
          label="Students"
          value={data.students.length}
          icon={GraduationCap}
          accent="#3E7BA6"
          loading={loading}
        />
        <StatCard
          label="Courses"
          value={data.courses.length}
          icon={BookOpen}
          accent="#4F8767"
          loading={loading}
        />
        <StatCard
          label="Enrollments"
          value={data.enrollments.length}
          icon={ClipboardList}
          accent="#A6314A"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        {/* Departments at a glance */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-line">
            <div>
              <p className="eyebrow mb-1">Breakdown</p>
              <h3 className="font-display text-lg font-semibold text-parchment">
                Departments at a glance
              </h3>
            </div>
            <Link
              to="/departments"
              className="text-xs font-medium text-gold flex items-center gap-1 hover:text-gold-glow transition-colors"
            >
              View directory <ArrowUpRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-11 bg-surface-raised rounded-lg animate-pulse" />
              ))}
            </div>
          ) : perDepartment.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-muted">
                No departments recorded yet. Add one to see it summarized here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="eyebrow font-normal px-6 py-3.5">Department</th>
                    <th className="eyebrow font-normal px-6 py-3.5">Students</th>
                    <th className="eyebrow font-normal px-6 py-3.5">Courses</th>
                  </tr>
                </thead>
                <tbody>
                  {perDepartment.map((d) => (
                    <tr
                      key={d.department_id}
                      className="border-b border-line last:border-0 hover:bg-surface-raised/50 transition-colors"
                    >
                      <td className="px-6 py-3.5 text-parchment font-medium">{d.name}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sky w-6">{d.studentCount}</span>
                          {/* Bar width = this department's students compared with the largest department */}
                          <div className="hidden sm:block h-1.5 w-24 rounded-full bg-surface-raised">
                            <div
                              className="h-full rounded-full bg-sky/70"
                              style={{ width: `${(d.studentCount / largestStudentCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-sage">{d.courseCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: latest enrollments + AI shortcut */}
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-line">
              <h3 className="font-display text-base font-semibold text-parchment">
                Latest enrollments
              </h3>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 bg-surface-raised rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentEnrollments.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">No enrollments yet.</p>
            ) : (
              <ul>
                {recentEnrollments.map((enrollment) => (
                  <li key={enrollment.id} className="px-5 py-3 border-b border-line last:border-0">
                    <p className="text-sm font-medium text-parchment">
                      {findStudentName(enrollment.student_id)}
                    </p>
                    <p className="text-xs text-muted">
                      {findCourseLabel(enrollment.course_id)} · Semester {enrollment.semester}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            to="/uni-assist"
            className="card block p-5 transition-colors hover:!border-gold/50 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-9 h-9 rounded-full bg-gold/10 border border-gold/30 text-gold flex items-center justify-center">
                <Sparkles size={16} />
              </span>
              <h3 className="font-display text-base font-semibold text-parchment">
                Ask UniAssist AI
              </h3>
              <ArrowUpRight
                size={15}
                className="ml-auto text-muted group-hover:text-gold transition-colors"
              />
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Get answers about admissions, fees and policies from the official university
              documents.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
