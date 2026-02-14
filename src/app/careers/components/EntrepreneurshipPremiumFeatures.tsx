import { 
  DocumentTextIcon, 
  BellAlertIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import PremiumFeatureCard from './PremiumFeatureCard';

export default function EntrepreneurshipPremiumFeatures() {
  const premiumFeatures = [
    {
      icon: DocumentTextIcon,
      title: "Advanced Business Plan Builder",
      description: "Create professional business plans with AI-assisted financial projections, SWOT analysis, and investor pitch decks tailored for veteran entrepreneurs.",
    },
    {
      icon: BellAlertIcon,
      title: "Contract Opportunity Alerts",
      description: "Get real-time notifications of government contracts for veteran-owned businesses, with RFP/RFQ analysis and response templates.",
    },
    {
      icon: UserGroupIcon,
      title: "Business Mentor Network",
      description: "Connect with successful veteran entrepreneurs for one-on-one virtual sessions, join mastermind groups, and attend expert office hours.",
    },
    {
      icon: CurrencyDollarIcon,
      title: "Funding Resource Toolkit",
      description: "Access grant applications templates, SBA loan guidance, investor connections, and financial projection tools for veteran business owners.",
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-[#644F0E] relative overflow-hidden">
      {/* Patriotic decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-white"></div>
        <div className="absolute top-8 left-0 w-full h-1 bg-[#B22234]"></div>
        <div className="absolute top-16 left-0 w-full h-1 bg-white"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/30 rounded-full blur-3xl"></div>
      </div>
    
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold mb-4">
            <SparklesIcon className="h-4 w-4 mr-2 text-yellow-400" />
            Premium Benefits
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Accelerate Your <span className="text-[#EAB308]">Business Growth</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Take your veteran-owned business to the next level with premium entrepreneurship tools.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {premiumFeatures.map((feature, index) => (
            <PremiumFeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              colorScheme="amber"
            />
          ))}
        </div>
        
        <div className="text-center mt-14">
          <button className="px-8 py-4 bg-[#EAB308] text-gray-900 font-semibold rounded-md hover:bg-[#FACC15] transition-all shadow-lg shadow-[#EAB308]/20 inline-flex items-center justify-center focus:ring-4 focus:ring-[#EAB308]/30 focus:outline-none">
            Upgrade to Premium Access
          </button>
          <p className="text-gray-400 mt-4 text-sm">
            Unlock all premium features for $9.99/month. <span className="text-white">Free for veterans with 10+ years of service.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
