import { BriefcaseIcon, LightBulbIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface TestimonialProps {
  initials: string;
  name: string;
  position: string;
  quote: string;
  icon: React.ElementType;
  iconText: string;
  colorScheme: 'blue' | 'amber';
}

function Testimonial({ 
  initials, 
  name, 
  position, 
  quote, 
  icon: Icon, 
  iconText, 
  colorScheme 
}: TestimonialProps) {
  const borderColor = colorScheme === 'blue' ? 'border-blue-100' : 'border-amber-100';
  const iconColor = colorScheme === 'blue' ? 'text-[#1A2C5B]' : 'text-amber-600';
  const textColor = colorScheme === 'blue' ? 'text-[#1A2C5B]' : 'text-amber-600';
  const accentColor = colorScheme === 'blue' ? 'bg-[#1A2C5B]' : 'bg-[#EAB308]';
  const gradientFrom = colorScheme === 'blue' 
    ? 'from-blue-700 to-blue-900' 
    : 'from-amber-600 to-amber-700';
  const borderAccent = colorScheme === 'blue' 
    ? 'border-[#1A2C5B]' 
    : 'border-[#EAB308]';

  return (
    <div className={`bg-gradient-to-b from-blue-50 to-white rounded-2xl p-8 shadow-xl relative border ${borderColor}`}>
      <div className={`absolute top-0 left-0 w-full h-1 ${accentColor}`}></div>
      <div className="flex items-center mb-6">
        <div className={`w-16 h-16 rounded-full overflow-hidden mr-4 border-2 ${borderAccent}`}>
          <div className={`w-full h-full bg-gradient-to-br ${gradientFrom} flex items-center justify-center text-white font-bold text-lg`}>
            {initials}
          </div>
        </div>
        <div>
          <h3 className="font-bold text-lg text-[#1A2C5B]">{name}</h3>
          <p className="text-sm text-gray-600">{position}</p>
        </div>
      </div>
      <div className="mb-6">
        <div className="flex mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg key={star} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <p className="text-gray-700 italic">{quote}</p>
      </div>
      <div className={`pt-4 border-t ${borderColor}`}>
        <div className="flex items-center">
          <Icon className={`h-5 w-5 ${iconColor} mr-2`} />
          <span className={`text-sm font-medium ${textColor}`}>{iconText}</span>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-gray-50 relative overflow-hidden">
      {/* Patriotic decorative elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#B22234] via-white to-[#1A2C5B]"></div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-16 left-10 w-64 h-64 rounded-full bg-blue-100/80 mix-blend-multiply blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-red-100/80 mix-blend-multiply blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-blue-50 text-[#1A2C5B] text-sm font-semibold mb-4">
            <UserGroupIcon className="h-4 w-4 mr-2" />
            Success Stories
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2C5B] mb-4">
            Veterans Success Stories
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Hear from veterans who have found professional success through employment and entrepreneurship.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Employment Success Story */}
          <Testimonial 
            initials="DM"
            name="David Martinez"
            position="U.S. Army Veteran • IT Security Specialist"
            quote="Vet1Stop's Military Skills Translator and resume builder helped me land a federal IT security position. The resource guides showed me how my military cybersecurity experience directly translated to civilian certifications and roles."
            icon={BriefcaseIcon}
            iconText="Employment Success Story"
            colorScheme="blue"
          />
          
          {/* Entrepreneurship Success Story */}
          <Testimonial 
            initials="JW"
            name="Jennifer Wilson"
            position="U.S. Navy Veteran • Founder, LogisticsPro Inc."
            quote="Using the business plan templates and SBA loan resources from Vet1Stop, I started a logistics company leveraging my Navy supply chain experience. The VOSB certification guide helped me secure my first government contract."
            icon={LightBulbIcon}
            iconText="Entrepreneurship Success Story"
            colorScheme="amber"
          />
        </div>
      </div>
    </section>
  );
}
