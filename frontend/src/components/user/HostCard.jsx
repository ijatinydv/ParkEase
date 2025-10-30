import { motion } from 'framer-motion';
import { 
  StarIcon, 
  CheckBadgeIcon, 
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/solid';
import Card from '@components/common/Card';
import Button from '@components/common/Button';

/**
 * HostCard Component
 * Displays host profile information
 */
const HostCard = ({ host, onContact }) => {
  if (!host) {
    return null;
  }

  const {
    name = 'Unknown Host',
    profileImage,
    trustScore = 0,
    isVerified = false,
    totalListings = 0,
    memberSince,
    responseRate = 0,
    responseTime = 'N/A',
  } = host;

  // Format member since date
  const formatMemberSince = (date) => {
    if (!date) return 'Recently joined';
    const joinDate = new Date(date);
    const now = new Date();
    const months = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24 * 30));
    
    if (months < 1) return 'Joined this month';
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} hosting`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} hosting`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="sticky top-24">
        <div className="flex items-start gap-4 mb-6">
          {/* Host avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* Verification badge */}
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                  <CheckBadgeIcon className="w-5 h-5 text-blue-600" />
                </div>
              )}
            </div>
          </div>

          {/* Host info */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">
              Hosted by {name}
            </h3>
            <p className="text-sm text-neutral-600">
              {formatMemberSince(memberSince)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-neutral-200">
          {/* Trust score */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <StarIcon className="w-4 h-4 text-yellow-500" />
              <span className="text-lg font-semibold text-neutral-900">
                {trustScore.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-neutral-600">Trust Score</p>
          </div>

          {/* Total listings */}
          <div>
            <div className="text-lg font-semibold text-neutral-900 mb-1">
              {totalListings}
            </div>
            <p className="text-xs text-neutral-600">
              Listing{totalListings !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Response rate */}
          <div>
            <div className="text-lg font-semibold text-neutral-900 mb-1">
              {responseRate}%
            </div>
            <p className="text-xs text-neutral-600">Response rate</p>
          </div>

          {/* Response time */}
          <div>
            <div className="text-lg font-semibold text-neutral-900 mb-1">
              {responseTime}
            </div>
            <p className="text-xs text-neutral-600">Response time</p>
          </div>
        </div>

        {/* Host highlights */}
        <div className="space-y-3 mb-6">
          {isVerified && (
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <CheckBadgeIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>Verified host</span>
            </div>
          )}
          
          {trustScore >= 4.5 && (
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <StarIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <span>Highly rated host</span>
            </div>
          )}

          {responseRate >= 90 && (
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <ChatBubbleLeftIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span>Quick to respond</span>
            </div>
          )}
        </div>

        {/* Contact button */}
        <Button
          fullWidth
          variant="outline"
          icon={ChatBubbleLeftIcon}
          onClick={onContact}
        >
          Contact Host
        </Button>

        {/* Safety notice */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <p className="text-xs text-neutral-600 leading-relaxed">
            <strong className="text-neutral-900">Safety first:</strong> Always communicate
            through ParkEase. Never share personal or payment information outside the platform.
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

export default HostCard;
