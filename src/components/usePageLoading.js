import { useState, useCallback, useEffect, useRef } from "react";

const usePageLoading = (total) => {
  const [resolved, setResolved] = useState(0);
  const [minElapsed, setMinElapsed] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setMinElapsed(true), 1000);
    return () => clearTimeout(timerRef.current);
  }, []);

  const onResolved = useCallback(() => {
    setResolved((prev) => prev + 1);
  }, []);

  return [resolved < total || !minElapsed, onResolved];
};

export default usePageLoading;
