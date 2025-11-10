import React from 'react';

type JobStatusFilter = 'active' | 'completed';

export interface JobFilterState {
  statuses: JobStatusFilter[];
  tagIds: string[];
  memberIds: string[];
}

type JobFilterUpdater =
  | Partial<JobFilterState>
  | ((previous: JobFilterState) => JobFilterState);

interface JobFilterContextValue {
  filters: JobFilterState;
  updateFilters: (updater: JobFilterUpdater) => void;
  resetFilters: () => void;
}

const INITIAL_FILTER_STATE: JobFilterState = {
  statuses: [],
  tagIds: [],
  memberIds: [],
};

const JobFilterContext = React.createContext<JobFilterContextValue | undefined>(
  undefined
);

export function JobFilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = React.useState<JobFilterState>(
    INITIAL_FILTER_STATE
  );

  const updateFilters = React.useCallback((updater: JobFilterUpdater) => {
    setFilters((previous) =>
      typeof updater === 'function'
        ? (updater as (prev: JobFilterState) => JobFilterState)(previous)
        : {
            ...previous,
            ...(updater.statuses !== undefined
              ? { statuses: updater.statuses }
              : {}),
            ...(updater.tagIds !== undefined ? { tagIds: updater.tagIds } : {}),
            ...(updater.memberIds !== undefined
              ? { memberIds: updater.memberIds }
              : {}),
          }
    );
  }, []);

  const resetFilters = React.useCallback(() => {
    setFilters(INITIAL_FILTER_STATE);
  }, []);

  const value = React.useMemo(
    () => ({
      filters,
      updateFilters,
      resetFilters,
    }),
    [filters, updateFilters, resetFilters]
  );

  return (
    <JobFilterContext.Provider value={value}>
      {children}
    </JobFilterContext.Provider>
  );
}

export function useJobFilters(): JobFilterContextValue {
  const context = React.useContext(JobFilterContext);
  if (!context) {
    throw new Error(
      'useJobFilters must be used within a JobFilterProvider'
    );
  }
  return context;
}

