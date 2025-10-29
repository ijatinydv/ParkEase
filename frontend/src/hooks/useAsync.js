import { useState, useCallback } from 'react';

/**
 * Custom hook for handling async operations
 * @param {Function} asyncFunction - Async function to execute
 * @returns {Object} - { execute, loading, error, data, reset }
 */
const useAsync = (asyncFunction) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  /**
   * Execute async function
   */
  const execute = useCallback(
    async (...params) => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...params);
        setData(result);
        return { success: true, data: result };
      } catch (err) {
        const errorMessage = err.message || 'An error occurred';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction]
  );

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    loading,
    error,
    data,
    reset,
  };
};

export default useAsync;
