import PropTypes from 'prop-types';

/**
 * FeatureCard Component
 * Reusable feature card with icon, title, description, and hover effects
 */
const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  variant = 'default'
}) => {
  // Variant styles
  const variantStyles = {
    default: {
      container: 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-xl',
      title: 'text-gray-900',
      description: 'text-gray-600',
    },
    seeker: {
      container: 'bg-gradient-to-br from-blue-50 to-white border-blue-200 hover:border-blue-400 hover:shadow-xl',
      title: 'text-blue-900',
      description: 'text-blue-700',
    },
    host: {
      container: 'bg-gradient-to-br from-green-50 to-white border-green-200 hover:border-green-400 hover:shadow-xl',
      title: 'text-green-900',
      description: 'text-green-700',
    },
  };

  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <div 
      className={`
        relative p-6 sm:p-8 rounded-2xl border-2 
        ${styles.container}
        transition-all duration-300 
        hover:scale-105 hover:-translate-y-1
        group overflow-hidden
      `}
    >
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/50 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Icon Container */}
        <div className={`
          inline-flex items-center justify-center 
          w-14 h-14 sm:w-16 sm:h-16 
          ${iconBgColor} 
          rounded-xl sm:rounded-2xl mb-4 sm:mb-5
          group-hover:scale-110 group-hover:rotate-6
          transition-transform duration-300
        `}>
          {Icon && <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${iconColor}`} />}
          {!Icon && (
            <div className={`w-7 h-7 sm:w-8 sm:h-8 ${iconColor} flex items-center justify-center text-2xl`}>
              ✓
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className={`
          text-lg sm:text-xl font-bold mb-2 sm:mb-3 
          ${styles.title}
          group-hover:text-blue-600 transition-colors duration-300
        `}>
          {title}
        </h3>

        {/* Description */}
        <p className={`
          text-sm sm:text-base leading-relaxed 
          ${styles.description}
        `}>
          {description}
        </p>
      </div>

      {/* Decorative Corner Element */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};

FeatureCard.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  iconColor: PropTypes.string,
  iconBgColor: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'seeker', 'host']),
};

export default FeatureCard;
