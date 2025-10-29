import PropTypes from 'prop-types';

/**
 * Reusable Button Component
 * A flexible button component with multiple variants, sizes, and states
 */
const Button = ({
  children,
  onClick,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  fullWidth = false,
  icon: Icon = null,
  iconPosition = 'left',
  ariaLabel = '',
  ...props
}) => {
  // Base button styles
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant styles
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800 shadow-md hover:shadow-lg',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 active:bg-gray-400 border border-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800 shadow-md hover:shadow-lg',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 active:bg-green-800 shadow-md hover:shadow-lg',
    outline: 'bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 active:bg-blue-100',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300 active:bg-gray-200',
  };

  // Size styles
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  // Combine all styles
  const buttonStyles = `
    ${baseStyles}
    ${variants[variant] || variants.primary}
    ${sizes[size] || sizes.md}
    ${fullWidth ? 'w-full' : ''}
    ${loading ? 'cursor-wait' : ''}
    ${className}
  `.trim();

  // Handle button click
  const handleClick = (e) => {
    if (!loading && !disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={buttonStyles}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-busy={loading}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Left icon */}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon 
          className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}
          aria-hidden="true"
        />
      )}

      {/* Button text/children */}
      {children}

      {/* Right icon */}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon 
          className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}
          aria-hidden="true"
        />
      )}
    </button>
  );
};

Button.propTypes = {
  /** Button content */
  children: PropTypes.node.isRequired,
  /** Click handler function */
  onClick: PropTypes.func,
  /** Loading state */
  loading: PropTypes.bool,
  /** Disabled state */
  disabled: PropTypes.bool,
  /** Button variant style */
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'outline', 'ghost']),
  /** Button size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Button type attribute */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Full width button */
  fullWidth: PropTypes.bool,
  /** Icon component */
  icon: PropTypes.elementType,
  /** Icon position */
  iconPosition: PropTypes.oneOf(['left', 'right']),
  /** Accessible label */
  ariaLabel: PropTypes.string,
};

export default Button;
