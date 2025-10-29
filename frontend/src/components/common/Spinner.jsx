/**
 * Loading Spinner Component
 */
const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`
          animate-spin rounded-full border-b-2 border-primary-600
          ${sizes[size]}
        `}
      />
    </div>
  );
};

/**
 * Full Page Loading Component
 */
export const LoadingPage = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50">
      <Spinner size="xl" />
      {message && (
        <p className="mt-4 text-neutral-600 text-lg">{message}</p>
      )}
    </div>
  );
};

export default Spinner;
