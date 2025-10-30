import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * StatsCounter Component
 * Animated counter that counts up to target number when scrolled into view
 */
const StatsCounter = ({ 
  end, 
  duration = 2000, 
  suffix = '', 
  prefix = '',
  label,
  icon: Icon,
  separator = true,
  decimals = 0,
}) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const counterRef = useRef(null);

  /**
   * Animate the counter from 0 to end value
   */
  const animateCounter = useCallback(() => {
    const startTime = Date.now();
    const endValue = typeof end === 'string' ? parseFloat(end.replace(/[^0-9.]/g, '')) : end;

    const timer = setInterval(() => {
      const currentTime = Date.now();
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation (easeOutQuart)
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const currentValue = easeOut * endValue;

      setCount(currentValue);

      if (progress === 1) {
        clearInterval(timer);
        setCount(endValue);
      }
    }, 16); // ~60fps

    return () => clearInterval(timer);
  }, [end, duration]);

  /**
   * Intersection Observer to trigger animation when element is in view
   */
  useEffect(() => {
    const element = counterRef.current;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateCounter();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [hasAnimated, animateCounter]);

  /**
   * Format number with separators
   */
  const formatNumber = (num) => {
    const fixed = num.toFixed(decimals);
    if (separator) {
      return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return fixed;
  };

  return (
    <div 
      ref={counterRef}
      className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 group"
    >
      {/* Icon */}
      {Icon && (
        <div className="mb-4 text-blue-600 group-hover:text-blue-700 transition-colors duration-300 group-hover:scale-110 transform">
          <Icon className="w-12 h-12 sm:w-14 sm:h-14" />
        </div>
      )}

      {/* Counter Display */}
      <div className="text-center">
        <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
          <span>{prefix}</span>
          <span>{formatNumber(count)}</span>
          <span>{suffix}</span>
        </div>

        {/* Label */}
        {label && (
          <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
            {label}
          </p>
        )}
      </div>

      {/* Decorative Element */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50/0 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

StatsCounter.propTypes = {
  end: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  duration: PropTypes.number,
  suffix: PropTypes.string,
  prefix: PropTypes.string,
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  separator: PropTypes.bool,
  decimals: PropTypes.number,
};

export default StatsCounter;
