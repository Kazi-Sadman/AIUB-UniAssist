import React from "react";
import { Search, X } from "lucide-react";

// Search box shown above a management table, with a "Showing 3 of 12" counter.
export default function TableToolbar({
  searchText,
  onSearchTextChange,
  placeholder,
  shownCount,
  totalCount,
  recordName,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="relative w-full sm:w-80">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          type="text"
          className="input-field !pl-9 !pr-9"
          placeholder={placeholder}
          aria-label={placeholder}
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
        />
        {searchText && (
          <button
            className="icon-btn absolute right-1 top-1/2 -translate-y-1/2"
            onClick={() => onSearchTextChange("")}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <p className="text-xs text-muted">
        Showing {shownCount} of {totalCount} {recordName}
      </p>
    </div>
  );
}
