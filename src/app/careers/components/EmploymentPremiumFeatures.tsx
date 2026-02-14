import { 
  DocumentTextIcon, 
  VideoCameraIcon, 
  BuildingOfficeIcon, 
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import PremiumFeatureCard from './PremiumFeatureCard';

export default function EmploymentPremiumFeatures() {
  const premiumFeatures = [
    {
      icon: DocumentTextIcon,
      title: "AI Resume Builder & Analyzer",
      description: "Get an AI-powered resume customized for your military background with skills translation, ATS optimization, and personalized improvement suggestions.",
    },
    {
      icon: VideoCameraIcon,
      title: "Virtual Interview Preparation",
      description: "Practice interviews with AI simulations, get feedback on your responses, and learn how to effectively translate your military experiences for civilian employers.",
    },
    {
      icon: BuildingOfficeIcon,
      title: "Premium Job Listings",
      description: "Access exclusive veteran-friendly job opportunities, early federal job postings, and direct application channels to hiring managers.",
    },
    {
      icon: ChartBarIcon,
      title: "Career Path Planning",
      description: "Get a personalized career roadmap with skills gap analysis, training recommendations, and salary progression forecasting for your desired industry.",
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-[#1A2C5B] relative overflow-hidden">
      {/* Patriotic decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-white"></div>
        <div className="absolute top-8 left-0 w-full h-1 bg-[#B22234]"></div>
        <div className="absolute top-16 left-0 w-full h-1 bg-white"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl"></div>
      </div>
    
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold mb-4">
            <SparklesIcon className="h-4 w-4 mr-2 text-yellow-400" />
            Premium Benefits
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Unlock Advanced Employment <span className="text-[#EAB308]">Tools</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Accelerate your civilian career with premium tools designed specifically for veterans.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {premiumFeatures.map((feature, index) => (
            <PremiumFeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              colorScheme="blue"
            />
          ))}
        </div>
        
        <div className="text-center mt-14">
          <button className="px-8 py-4 bg-[#EAB308] text-[#1A2C5B] font-semibold rounded-md hover:bg-[#FACC15] transition-all shadow-lg shadow-[#EAB308]/20 inline-flex items-center justify-center focus:ring-4 focus:ring-[#EAB308]/30 focus:outline-none">
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
