import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, CheckCircle2, XCircle, Info } from "lucide-react";
import axiosClient from "../api/axiosClient";
import departmentApi from "../api/departmentApi";
import studentApi from "../api/studentApi";
import courseApi from "../api/courseApi";
import enrollmentApi from "../api/enrollmentApi";
import PageHeader from "../components/PageHeader";

// Each service is checked by calling its existing "get all" request.
const servicesToCheck = [
  { name: "Departments", route: "GET /departments/", fetchRecords: departmentApi.getAll },
  { name: "Students", route: "GET /students/", fetchRecords: studentApi.getAll },
  { name: "Courses", route: "GET /courses/", fetchRecords: courseApi.getAll },
  { name: "Enrollments", route: "GET /enrollments/", fetchRecords: enrollmentApi.getAll },
];

// Calls one service and records how long it took and whether it worked.
async function checkService(service) {
  const startTime = performance.now();
  try {
    const records = await service.fetchRecords();
    return {
      ...service,
      isHealthy: true,
      responseMilliseconds: Math.round(performance.now() - startTime),
      recordCount: Array.isArray(records) ? records.length : null,
    };
  } catch (err) {
    return { ...service, isHealthy: false, errorMessage: err.message };
  }
}

export default function SystemHealthPage() {
  const [checkResults, setCheckResults] = useState([]);
  const [isChecking, setIsChecking] = useState(true);
  const [lastCheckedAt, setLastCheckedAt] = useState(null);

  const runHealthChecks = useCallback(async () => {
    setIsChecking(true);
    const results = await Promise.all(servicesToCheck.map(checkService));
    setCheckResults(results);
    setLastCheckedAt(new Date());
    setIsChecking(false);
  }, []);

  useEffect(() => {
    runHealthChecks();
  }, [runHealthChecks]);

  const failingCount = checkResults.filter((result) => !result.isHealthy).length;
  const hasResults = checkResults.length > 0;

  return (
    <div>
      <PageHeader
        eyebrow="Tools / Status"
        title="System health"
        description="Checks that the backend is reachable and each record service is answering."
        action={
          <button className="btn-ghost" onClick={runHealthChecks} disabled={isChecking}>
            <RefreshCw size={15} className={isChecking ? "animate-spin" : ""} />
            {isChecking ? "Checking…" : "Check again"}
          </button>
        }
      />

      {hasResults && (
        <div
          className={`card flex items-center gap-3 px-5 py-4 mb-6 ${
            failingCount === 0 ? "!border-sage/40" : "!border-crimson/40"
          }`}
        >
          {failingCount === 0 ? (
            <CheckCircle2 className="text-sage shrink-0" size={20} />
          ) : (
            <XCircle className="text-crimson shrink-0" size={20} />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-parchment">
              {failingCount === 0
                ? "All record services are responding"
                : `${failingCount} of ${checkResults.length} services are not responding`}
            </p>
            <p className="text-xs text-muted break-all">
              Backend: {axiosClient.defaults.baseURL}
              {lastCheckedAt && ` · Checked at ${lastCheckedAt.toLocaleTimeString()}`}
            </p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="eyebrow font-normal px-6 py-3.5">Service</th>
                <th className="eyebrow font-normal px-6 py-3.5">Request</th>
                <th className="eyebrow font-normal px-6 py-3.5">Status</th>
                <th className="eyebrow font-normal px-6 py-3.5">Response time</th>
                <th className="eyebrow font-normal px-6 py-3.5">Records</th>
              </tr>
            </thead>
            <tbody>
              {!hasResults
                ? servicesToCheck.map((service) => (
                    <tr key={service.name} className="border-b border-line last:border-0">
                      <td className="px-6 py-3.5 text-parchment font-medium">{service.name}</td>
                      <td className="px-6 py-3.5 font-mono text-muted">{service.route}</td>
                      <td colSpan={3} className="px-6 py-3.5">
                        <div className="h-5 w-32 bg-surface-raised rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                : checkResults.map((result) => (
                    <tr key={result.name} className="border-b border-line last:border-0">
                      <td className="px-6 py-3.5 text-parchment font-medium">{result.name}</td>
                      <td className="px-6 py-3.5 font-mono text-muted whitespace-nowrap">
                        {result.route}
                      </td>
                      <td className="px-6 py-3.5">
                        {result.isHealthy ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-sage/10 text-sage border border-sage/30 rounded-full px-2.5 py-1">
                            Responding
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium bg-crimson/10 text-crimson border border-crimson/30 rounded-full px-2.5 py-1"
                            title={result.errorMessage}
                          >
                            Not responding
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-muted">
                        {result.isHealthy ? `${result.responseMilliseconds} ms` : "—"}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-muted">
                        {result.isHealthy ? result.recordCount : "—"}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card flex gap-3 px-5 py-4 text-sm text-muted leading-relaxed">
        <Info size={18} className="text-sky shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <p>
            <span className="text-parchment font-medium">
              UniAssist AI is not checked automatically.
            </span>{" "}
            Every request to <span className="font-mono">POST /api/chat</span> runs a real question
            through the RAG pipeline, so pinging it would be slow and costly. Test it by asking a
            question on the UniAssist AI page.
          </p>
          <p>
            For a deeper status check (database connection, vector index, LLM provider), the backend
            would need to expose a dedicated endpoint such as{" "}
            <span className="font-mono">GET /health</span>. This page does not assume one exists.
          </p>
        </div>
      </div>
    </div>
  );
}
