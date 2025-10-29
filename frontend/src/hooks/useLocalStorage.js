import { useState, useEffect } from 'react';

/**
 * Custom hook for local storage
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value
 * @returns {Array} [value, setValue, removeValue]
 */
const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, value]);

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setValue(initialValue);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  };

  return [value, setValue, removeValue];
};

export default useLocalStorage;
