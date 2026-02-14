import { Pathway } from '@/types/pathway';

/**
 * Mock service for pathways when database connection is unavailable
 */
export const getMockPathways = (): Pathway[] => {
  return [
    {
      id: "pathway-1",
      title: "Transitioning from Military Healthcare",
      description: "A step-by-step guide to help veterans transition from military healthcare to civilian or VA healthcare systems.",
      targetAudience: ["Recently separated veterans", "Veterans within 1 year of separation"],
      icon: "transition",
      steps: [
        /* Steps omitted for brevity */
      ],
      tags: ["healthcare transition", "military separation", "VA enrollment", "medical records"],
      recommendedFor: ["Recently separated veterans", "Transitioning service members"],
      estimatedDuration: 110,
      difficulty: "medium",
      featured: true
    },
    {
      id: "pathway-2",
      title: "Mental Health and PTSD Support",
      description: "Navigate the resources and steps for addressing PTSD and other mental health concerns as a veteran.",
      targetAudience: ["Veterans with PTSD", "Veterans seeking mental health support"],
      icon: "mental-health",
      steps: [
        /* Steps omitted for brevity */
      ],
      tags: ["PTSD", "mental health", "veteran support", "crisis resources"],
      recommendedFor: ["Combat veterans", "Veterans with trauma history", "Family members of veterans"],
      estimatedDuration: 90,
      difficulty: "medium",
      featured: true
    },
    {
      id: "pathway-3",
      title: "Accessing Emergency Care",
      description: "Know when and how to get emergency care as a veteran, including VA and non-VA options.",
      targetAudience: ["All veterans", "Veterans with VA healthcare"],
      icon: "emergency",
      steps: [
        /* Steps omitted for brevity */
      ],
      tags: ["emergency care", "urgent care", "VA healthcare", "medical emergencies"],
      recommendedFor: ["All veterans with VA healthcare", "Recently enrolled veterans", "Veterans with chronic conditions"],
      estimatedDuration: 75,
      difficulty: "easy",
      featured: true
    },
    {
      id: "pathway-4",
      title: "Women's Health for Veterans",
      description: "A comprehensive guide to women's health services, benefits, and resources available to women veterans.",
      targetAudience: ["Women veterans", "Caregivers of women veterans"],
      icon: "women-health",
      steps: [
        /* Steps omitted for brevity */
      ],
      tags: ["women's health", "women veterans", "reproductive health", "maternity care", "mental health"],
      recommendedFor: ["Women veterans", "Female service members preparing to transition", "Healthcare providers working with women veterans"],
      estimatedDuration: 85,
      difficulty: "easy",
      featured: true
    },
    {
      id: "pathway-5",
      title: "Chronic Pain Management",
      description: "A comprehensive journey through understanding, treating, and living with chronic pain as a veteran, with both VA and community resources.",
      targetAudience: ["Veterans with chronic pain", "Veterans with service-connected injuries", "Caregivers"],
      icon: "pain-management",
      steps: [
        /* Steps omitted for brevity */
      ],
      tags: ["chronic pain", "pain management", "veterans health", "rehabilitation", "complementary health"],
      recommendedFor: ["Veterans with chronic pain", "Veterans with service-connected injuries", "Healthcare providers", "Family caregivers"],
      estimatedDuration: 90,
      difficulty: "medium",
      featured: true
    },
    {
      id: "pathway-6",
      title: "Substance Use Recovery",
      description: "A supportive pathway for veterans seeking recovery from substance use disorders, covering VA and community services, treatment options, and long-term recovery support.",
      targetAudience: ["Veterans with substance use concerns", "Family members of veterans with substance use disorders", "Veterans in recovery"],
      icon: "recovery",
      steps: [
        /* Steps omitted for brevity */
      ],
      tags: ["substance use", "addiction", "recovery", "mental health", "support groups"],
      recommendedFor: ["Veterans with substance use disorders", "Veterans in recovery", "Family members of veterans with addiction", "VA healthcare providers"],
      estimatedDuration: 100,
      difficulty: "medium",
      featured: true
    },
    {
      id: "pathway-7",
      title: "Preventive Care and Wellness",
      description: "A comprehensive guide to preventive healthcare, wellness practices, and healthy lifestyle strategies specifically for veterans.",
      targetAudience: ["All veterans", "Transitioning service members", "Veterans with health risk factors"],
      icon: "wellness",
      steps: [
        /* Steps omitted for brevity */
      ],
      tags: ["preventive health", "wellness", "nutrition", "physical activity", "stress management", "sleep"],
      recommendedFor: ["All veterans", "Recently separated veterans", "Veterans with chronic conditions", "Caregivers"],
      estimatedDuration: 90,
      difficulty: "easy",
      featured: true
    },
    {
      id: "pathway-8",
      title: "Benefits for Aging Veterans/Geriatric Care",
      description: "A comprehensive guide to the special benefits, services, and resources available to aging veterans, including long-term care options and end-of-life planning.",
      targetAudience: ["Veterans age 65+", "Caregivers of elderly veterans", "Veterans with age-related conditions"],
      icon: "geriatric-care",
      steps: [
        /* Steps omitted for brevity */
      ],
      tags: ["aging veterans", "geriatric care", "elder care", "long-term care", "caregiver support", "end-of-life planning"],
      recommendedFor: ["Veterans age 65+", "Caregivers of elderly veterans", "Veterans with chronic health conditions", "Veterans planning for long-term care needs"],
      estimatedDuration: 100,
      difficulty: "medium",
      featured: true
    }
  ];
};
