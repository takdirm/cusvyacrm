import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { toUtcEndOfDayIso, toUtcStartOfDayIso } from '../utils/dashboardHelpers';

const buildParams = (filters) => ({
  from: toUtcStartOfDayIso(filters.from),
  to: toUtcEndOfDayIso(filters.to),
  groupBy: filters.groupBy,
});

const useDashboardRequest = (fetcher, initialFilters) => {
  const requestIdRef = useRef(0);
  const selectedRegionCode = useSelector((state) => state.region?.selected?.code || null);
  const regionLoading = useSelector((state) => Boolean(state.region?.loading));
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    if (regionLoading) {
      return;
    }

    if (!selectedRegionCode) {
      setLoading(false);
      setData(null);
      setError({
        response: {
          status: 400,
          data: {
            message: 'RegionContextRequired',
          },
        },
      });
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const nextData = await fetcher(buildParams(filters));
      if (requestId === requestIdRef.current) {
        setData(nextData);
        setError(null);
        setLastUpdated(new Date().toISOString());
      }
    } catch (nextError) {
      if (requestId === requestIdRef.current) {
        setError(nextError);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [fetcher, filters, regionLoading, selectedRegionCode]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    error,
    filters,
    lastUpdated,
    loading,
    refresh: load,
    setFilters,
  };
};

export default useDashboardRequest;
