import { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

/**
 * Reusable Input Component
 * A flexible input component with label, error handling, and icon support
 */
const Input = forwardRef(({
  label,
  type = 'text',
  name,
  placeholder = '',
  error = '',
  disabled = false,
  required = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  containerClassName = '',
  rows = 4,
  helperText = '',
  autoComplete = 'off',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  
  // Determine actual input type (handle password visibility toggle)
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Base input styles
  const baseInputStyles = 'w-full px-4 py-2.5 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed';
  
  // Conditional styles based on error state
  const conditionalStyles = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200';

  // Icon padding styles
  const iconPaddingStyles = Icon && iconPosition === 'left' ? 'pl-11' : Icon && iconPosition === 'right' ? 'pr-11' : '';
  
  // Password toggle padding
  const passwordPaddingStyles = type === 'password' ? 'pr-11' : '';

  // Combined input styles
  const inputStyles = `${baseInputStyles} ${conditionalStyles} ${iconPaddingStyles} ${passwordPaddingStyles} ${className}`.trim();

  // Label styles
  const labelStyles = `block text-sm font-medium text-gray-700 mb-1.5 ${required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}`;

  return (
    <div className={`w-full ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={name} 
          className={labelStyles}
        >
          {label}
        </label>
      )}

      {/* Input container with icon */}
      <div className="relative">
        {/* Left icon */}
        {Icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        )}

        {/* Input or Textarea */}
        {type === 'textarea' ? (
          <textarea
            ref={ref}
            id={name}
            name={name}
            rows={rows}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            className={inputStyles}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
            {...props}
          />
        ) : (
          <input
            ref={ref}
            type={inputType}
            id={name}
            name={name}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            className={inputStyles}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
            {...props}
          />
        )}

        {/* Right icon */}
        {Icon && iconPosition === 'right' && type !== 'password' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        )}

        {/* Password visibility toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <AiOutlineEyeInvisible className="w-5 h-5" aria-hidden="true" />
            ) : (
              <AiOutlineEye className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Helper text */}
      {helperText && !error && (
        <p 
          id={`${name}-helper`}
          className="mt-1.5 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p 
          id={`${name}-error`}
          className="mt-1.5 text-sm text-red-600 flex items-start gap-1"
          role="alert"
        >
          <svg 
            className="w-4 h-4 mt-0.5 flex-shrink-0" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  /** Input label */
  label: PropTypes.string,
  /** Input type */
  type: PropTypes.oneOf(['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time', 'datetime-local', 'textarea']),
  /** Input name attribute */
  name: PropTypes.string.isRequired,
  /** Placeholder text */
  placeholder: PropTypes.string,
  /** Error message */
  error: PropTypes.string,
  /** Disabled state */
  disabled: PropTypes.bool,
  /** Required field */
  required: PropTypes.bool,
  /** Icon component */
  icon: PropTypes.elementType,
  /** Icon position */
  iconPosition: PropTypes.oneOf(['left', 'right']),
  /** Additional CSS classes for input */
  className: PropTypes.string,
  /** Additional CSS classes for container */
  containerClassName: PropTypes.string,
  /** Textarea rows (only for textarea type) */
  rows: PropTypes.number,
  /** Helper text */
  helperText: PropTypes.string,
  /** Autocomplete attribute */
  autoComplete: PropTypes.string,
};

export default Input;
