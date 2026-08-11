import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";

export function useApi(initial = null) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(
    async (promise, opts = {}) => {
      const { silent = false, transform } = opts;
      setLoading(true);
      setError(null);
      try {
        const res = await promise;
        if (isMounted.current) {
          setData(transform ? transform(res.data) : res.data);
        }
        return res.data;
      } catch (err) {
        if (isMounted.current) setError(err);
        if (!silent) throw err;
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    []
  );

  return { data, setData, loading, error, execute };
}

export const getData = (path, params) => api.get(path, { params });
