/**
 * Card Component
 */
const Card = ({
  children,
  className = '',
  padding = true,
  hover = false,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg shadow-sm border border-neutral-200
        ${padding ? 'p-6' : ''}
        ${hover ? 'hover:shadow-md transition-shadow duration-200 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
