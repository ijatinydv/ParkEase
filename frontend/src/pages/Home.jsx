import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BoltIcon,
  ShieldCheckIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  StarIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import { HeroSection, HowItWorks, FeatureCard, TestimonialCard, StatsCounter } from '@/components/home';
import SpotCard from '@/components/spots/SpotCard';
import spotService from '@/services/spotService';

/**
 * Home Component
 * Main landing page with all sections
 */
const Home = () => {
  const navigate = useNavigate();
  const [featuredSpots, setFeaturedSpots] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetch featured parking spots on component mount
   */
  useEffect(() => {
    fetchFeaturedSpots();
  }, []);

  const fetchFeaturedSpots = async () => {
    try {
      setLoading(true);
      const response = await spotService.getSpots({ limit: 6, sortBy: 'rating', sortOrder: 'desc' });
      setFeaturedSpots(response.data?.spots || []);
    } catch (error) {
      console.error('Error fetching featured spots:', error);
      // Use static data as fallback
      setFeaturedSpots([]);
    } finally {
      setLoading(false);
    }
  };

  // Features for Seekers
  const seekerFeatures = [
    {
      icon: BoltIcon,
      title: 'Instant Booking',
      description: 'Find and book parking spots instantly with real-time availability. No waiting, no hassle.',
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Verified Parking Spots',
      description: 'All parking spots are verified with photos and reviews. Park with complete peace of mind.',
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
    },
    {
      icon: LockClosedIcon,
      title: 'Secure Payments',
      description: 'Pay securely through Razorpay with multiple payment options. Your money is always protected.',
      iconColor: 'text-purple-600',
      iconBgColor: 'bg-purple-100',
    },
    {
      icon: ClockIcon,
      title: 'Real-time Availability',
      description: 'Check live availability and book instantly. Save time and avoid driving around looking for parking.',
      iconColor: 'text-orange-600',
      iconBgColor: 'bg-orange-100',
    },
  ];

  // Features for Hosts
  const hostFeatures = [
    {
      icon: CurrencyRupeeIcon,
      title: 'Earn Passive Income',
      description: 'Monetize your unused parking space and earn money every month with minimal effort.',
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
    },
    {
      icon: ClockIcon,
      title: 'List in Minutes',
      description: 'Create your listing in just a few minutes. Upload photos, set your price, and start earning.',
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
    },
    {
      icon: CalendarDaysIcon,
      title: 'Flexible Scheduling',
      description: 'Set your own availability and pricing. You control when your parking space is available.',
      iconColor: 'text-purple-600',
      iconBgColor: 'bg-purple-100',
    },
    {
      icon: CheckBadgeIcon,
      title: 'Verified Users',
      description: 'All users are verified for your security. Accept or reject bookings with complete control.',
      iconColor: 'text-orange-600',
      iconBgColor: 'bg-orange-100',
    },
  ];

  // Trust & Safety features
  const trustFeatures = [
    {
      icon: ShieldCheckIcon,
      title: 'Photo Verification',
      description: 'Every parking spot is verified with photos and location details.',
    },
    {
      icon: CreditCardIcon,
      title: 'Secure Payments',
      description: 'All payments processed through Razorpay with bank-level security.',
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Two-way Reviews',
      description: 'Honest reviews from both hosts and seekers build trust.',
    },
    {
      icon: PhoneIcon,
      title: '24/7 Support',
      description: 'Round-the-clock customer support for any issues or questions.',
    },
  ];

  // Testimonials
  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Seeker',
      rating: 5,
      quote: 'ParkEase saved me so much time and stress! I found parking near my office in seconds. The booking process was seamless and the spot was exactly as described.',
      location: 'Mumbai',
    },
    {
      name: 'Rajesh Kumar',
      role: 'Host',
      rating: 5,
      quote: 'I am earning ₹15,000 every month from my unused parking space! The platform is easy to use and the support team is very helpful. Highly recommended!',
      location: 'Bangalore',
    },
    {
      name: 'Anita Desai',
      role: 'Seeker',
      rating: 5,
      quote: 'No more driving around for 30 minutes looking for parking! ParkEase shows real-time availability and I can book instantly. Game changer for daily commuters.',
      location: 'Delhi',
    },
    {
      name: 'Vikram Singh',
      role: 'Host',
      rating: 4,
      quote: 'Great platform to monetize unused space. The verification process ensures I only get genuine bookings. My parking space is now a passive income stream!',
      location: 'Pune',
    },
  ];

  // Stats data
  const stats = [
    {
      end: 10000,
      suffix: '+',
      label: 'Parking Spots',
      icon: BuildingOfficeIcon,
    },
    {
      end: 50000,
      suffix: '+',
      label: 'Successful Bookings',
      icon: CheckBadgeIcon,
    },
    {
      end: 95,
      suffix: '%',
      label: 'Satisfaction Rate',
      icon: StarIcon,
    },
    {
      end: 30,
      suffix: '+',
      label: 'Cities Covered',
      icon: MapPinIcon,
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <HeroSection />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Features Section - For Seekers & Hosts */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Why Choose ParkEase?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you&apos;re looking for parking or want to earn from your space, we&apos;ve got you covered
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* For Seekers */}
            <div>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold mb-4">
                  <UserGroupIcon className="w-5 h-5" />
                  <span>For Parking Seekers</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  Find Parking Instantly
                </h3>
                <p className="text-gray-600">
                  Search, book, and park in seconds with verified spots across the city
                </p>
              </div>

              <div className="space-y-6">
                {seekerFeatures.map((feature, index) => (
                  <FeatureCard key={index} {...feature} variant="seeker" />
                ))}
              </div>
            </div>

            {/* For Hosts */}
            <div>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold mb-4">
                  <BuildingOfficeIcon className="w-5 h-5" />
                  <span>For Parking Hosts</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  Earn from Your Space
                </h3>
                <p className="text-gray-600">
                  Turn your unused parking space into a profitable asset
                </p>
              </div>

              <div className="space-y-6">
                {hostFeatures.map((feature, index) => (
                  <FeatureCard key={index} {...feature} variant="host" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Parking Spots Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Featured Parking Spots
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Discover top-rated parking spots verified by our community
            </p>
          </div>

          {/* Spots Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : featuredSpots.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 mb-12">
              {featuredSpots.map((spot) => (
                <SpotCard key={spot._id} spot={spot} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
              <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                No featured spots available at the moment. Check back soon!
              </p>
            </div>
          )}

          {/* View All CTA */}
          <div className="text-center">
            <button
              onClick={() => navigate('/search')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              View All Parking Spots
            </button>
          </div>
        </div>
      </section>

      {/* Trust & Safety Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Your Safety is Our Priority
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              We&apos;ve built ParkEase with security and trust at the core of everything we do
            </p>
          </div>

          {/* Trust Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {trustFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied users who trust ParkEase every day
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} user={testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              ParkEase by the Numbers
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Growing every day with our amazing community
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <StatsCounter key={index} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* Dual CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* For Seekers */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 sm:p-10 lg:p-12 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="mb-6">
                <UserGroupIcon className="w-16 h-16 text-blue-200 mb-4" />
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                  Find Your Perfect Parking Spot
                </h3>
                <p className="text-blue-100 text-lg mb-6">
                  Search thousands of verified parking spots across the city. Book instantly and park with confidence.
                </p>
              </div>
              <button
                onClick={() => navigate('/search')}
                className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Search Parking Now
              </button>
            </div>

            {/* For Hosts */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 sm:p-10 lg:p-12 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="mb-6">
                <BuildingOfficeIcon className="w-16 h-16 text-green-200 mb-4" />
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                  Start Earning from Your Parking Space
                </h3>
                <p className="text-blue-100 text-lg mb-6">
                  List your parking space in minutes and start earning passive income every month. It&apos;s that simple!
                </p>
              </div>
              <button
                onClick={() => navigate('/my-spots/new')}
                className="w-full sm:w-auto px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                List Your Spot
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
