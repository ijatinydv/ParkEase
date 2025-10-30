import PropTypes from 'prop-types';
import { 
  MagnifyingGlassIcon, 
  CreditCardIcon, 
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

/**
 * Default steps for How It Works section
 */
const DEFAULT_STEPS = [
  {
    id: 1,
    icon: MagnifyingGlassIcon,
    title: 'Search Your Location',
    description: 'Enter your destination and find available parking spots nearby with real-time availability.',
    color: 'blue',
  },
  {
    id: 2,
    icon: CreditCardIcon,
    title: 'Book & Pay Securely',
    description: 'Reserve your spot instantly with secure payment through Razorpay. Get instant confirmation.',
    color: 'green',
  },
  {
    id: 3,
    icon: CheckCircleIcon,
    title: 'Park with Confidence',
    description: 'Arrive at your verified parking spot hassle-free. Check in with QR code and enjoy your stay.',
    color: 'purple',
  },
];

/**
 * Color variants for step cards
 */
const COLOR_VARIANTS = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    numberBg: 'bg-blue-600',
    border: 'border-blue-200',
    hover: 'hover:border-blue-300',
  },
  green: {
    bg: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    numberBg: 'bg-green-600',
    border: 'border-green-200',
    hover: 'hover:border-green-300',
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    numberBg: 'bg-purple-600',
    border: 'border-purple-200',
    hover: 'hover:border-purple-300',
  },
  orange: {
    bg: 'bg-orange-50',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    numberBg: 'bg-orange-600',
    border: 'border-orange-200',
    hover: 'hover:border-orange-300',
  },
};

/**
 * HowItWorks Component
 * Displays a three-step process with icons and visual flow
 */
const HowItWorks = ({ 
  steps = DEFAULT_STEPS,
  title = "How It Works",
  subtitle = "Get started with ParkEase in three simple steps"
}) => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative">
          {/* Connector Lines (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 -translate-y-1/2 px-32">
            <div className="flex items-center justify-between">
              {steps.slice(0, -1).map((_, index) => (
                <div key={index} className="flex-1 flex items-center justify-end">
                  <div className="w-full h-1 bg-gradient-to-r from-gray-300 to-gray-400 relative">
                    {/* Animated Arrow */}
                    <ArrowRightIcon className="w-6 h-6 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const colors = COLOR_VARIANTS[step.color] || COLOR_VARIANTS.blue;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  {/* Step Card */}
                  <div 
                    className={`
                      relative w-full p-8 rounded-2xl border-2 
                      ${colors.bg} ${colors.border} ${colors.hover}
                      transition-all duration-300 
                      hover:shadow-xl hover:scale-105 hover:-translate-y-2
                      group
                    `}
                  >
                    {/* Step Number Badge */}
                    <div className={`
                      absolute -top-4 -right-4 w-12 h-12 
                      ${colors.numberBg} 
                      text-white rounded-full 
                      flex items-center justify-center 
                      text-xl font-bold shadow-lg
                      group-hover:scale-110 transition-transform duration-300
                    `}>
                      {index + 1}
                    </div>

                    {/* Icon Container */}
                    <div className={`
                      w-20 h-20 mx-auto mb-6 
                      ${colors.iconBg} 
                      rounded-2xl flex items-center justify-center
                      group-hover:rotate-6 transition-transform duration-300
                    `}>
                      <Icon className={`w-10 h-10 ${colors.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {/* Hover Effect Gradient */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>

                  {/* Mobile Arrow Indicator */}
                  {index < steps.length - 1 && (
                    <div className="md:hidden my-6 flex items-center justify-center">
                      <ArrowRightIcon className="w-8 h-8 text-gray-400 rotate-90 animate-bounce" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 sm:mt-16">
          <p className="text-gray-600 mb-4 text-lg">
            Ready to get started?
          </p>
          <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
            Find Parking Now
          </button>
        </div>
      </div>
    </section>
  );
};

HowItWorks.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    color: PropTypes.oneOf(['blue', 'green', 'purple', 'orange']),
  })),
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

export default HowItWorks;
