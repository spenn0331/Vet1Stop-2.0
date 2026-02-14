import { useState, useCallback } from 'react';
import { HealthResource } from '../../../types/consolidated-health-types';

/**
 * Hook for matching health resources based on user selections
 */
export function useResourceMatcher(allResources: HealthResource[]) {
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Main function to find matching resources based on user selections
     */
    const findMatchingResources = useCallback(async (
        categoryId: string | null,
        symptoms: string[],
        severityLevel: string | null,
        selectionHash?: string
    ): Promise<HealthResource[]> => {
        if (!categoryId) return [];

        setIsLoading(true);
        console.log(`Finding resources for category: ${categoryId}, symptoms: ${symptoms.join(', ')}, severity: ${severityLevel}`);

        try {
            // First try the health-resources API which should be working properly
            let resources: HealthResource[] = [];

            // Generate a unique selection hash for varied results
            const uniqueId = selectionHash ||
                `${categoryId}_${symptoms.join(',')}_${severityLevel}_${Date.now() % 1000}_${Math.random().toString(36).substring(2, 5)}`;

            try {
                const params = new URLSearchParams();
                params.append('symptomCategory', categoryId);

                if (symptoms.length > 0) {
                    params.append('symptoms', symptoms.join(','));
                }

                if (severityLevel) {
                    params.append('severityLevel', severityLevel);
                }

                params.append('selectionHash', uniqueId);

                console.log(`Fetching from API: /api/health-resources?${params.toString()}`);

                const response = await fetch(`/api/health-resources?${params.toString()}`);

                if (response.ok) {
                    const data = await response.json();

                    // Try to handle different response formats
                    if (data && data.data && Array.isArray(data.data)) {
                        resources = data.data;
                    } else if (data && data.resources && Array.isArray(data.resources)) {
                        resources = data.resources;
                    }

                    console.log(`Received ${resources.length} resources from API`);
                }
            } catch (error) {
                console.warn('API request failed:', error);
            }

            // If API didn't return any resources, use local filtering
            if (resources.length === 0) {
                console.log('API returned no resources, using local filtering');

                resources = localFilterResources(
                    allResources,
                    categoryId,
                    symptoms,
                    severityLevel,
                    uniqueId
                );
            }

            // Make sure we have at least some resources, even if we just return all of them
            if (resources.length === 0) {
                console.log('No resources found even with local filtering, returning general resources');
                resources = allResources.slice(0, 20);
            }

            // Always balance and diversify the results
            const balancedResources = balanceResourceTypes(
                resources,
                categoryId,
                symptoms,
                severityLevel,
                uniqueId
            );

            setIsLoading(false);
            return balancedResources;
        } catch (error) {
            console.error('Error in findMatchingResources:', error);
            setIsLoading(false);

            // Last resort - just return some resources
            return allResources.slice(0, 10);
        }
    }, [allResources]);

    /**
     * Local filtering function for when API call fails
     */
    function localFilterResources(
        resources: HealthResource[],
        categoryId: string,
        symptoms: string[],
        severityLevel: string | null,
        seed: string
    ): HealthResource[] {
        console.log('Filtering resources locally');

        // Generate a seed number for deterministic shuffling
        const seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        // Filter by category
        let filtered = resources.filter(resource => {
            // Check resource category/categories
            const categoryMatch =
                (resource.category && resource.category.toLowerCase().includes(categoryId.toLowerCase())) ||
                (resource.categories && Array.isArray(resource.categories) &&
                    resource.categories.some(cat => cat.toLowerCase().includes(categoryId.toLowerCase())));

            // Check resource tags for symptoms
            const symptomMatch = symptoms.length === 0 || (
                resource.tags && Array.isArray(resource.tags) &&
                symptoms.some(symptom =>
                    resource.tags.some(tag => tag.toLowerCase().includes(symptom.toLowerCase()))
                )
            );

            // Check severity/rating
            let severityMatch = true;
            if (severityLevel) {
                const rating = resource.rating || 0;
                switch (severityLevel) {
                    case 'mild': severityMatch = rating >= 3.0; break;
                    case 'moderate': severityMatch = rating >= 3.5; break;
                    case 'severe': severityMatch = rating >= 4.0; break;
                    case 'crisis': severityMatch = rating >= 4.5; break;
                }
            }

            return categoryMatch && symptomMatch && severityMatch;
        });

        // If we got very few results, relax the criteria
        if (filtered.length < 5) {
            console.log('Too few results, relaxing criteria');
            filtered = resources.filter(resource => {
                // Just match on category
                const categoryMatch =
                    (resource.category && resource.category.toLowerCase().includes(categoryId.toLowerCase())) ||
                    (resource.categories && Array.isArray(resource.categories) &&
                        resource.categories.some(cat => cat.toLowerCase().includes(categoryId.toLowerCase())));

                return categoryMatch;
            });
        }

        // Sort by rating
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        // If still too few, just return top-rated resources
        if (filtered.length < 5) {
            return resources.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);
        }

        return filtered;
    }

    /**
     * Balance resources to have a good mix of VA and non-VA resources
     */
    function balanceResourceTypes(
        resources: HealthResource[],
        categoryId: string | null,
        symptoms: string[],
        severityLevel: string | null,
        seed: string
    ): HealthResource[] {
        if (resources.length === 0) return [];

        // Seed for deterministic but varied results
        const seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        // Split into VA and other resources
        const vaResources = resources.filter(r =>
            r.resourceType === 'va' ||
            (r.organization && r.organization.includes('Veterans Affairs'))
        );

        const ngoResources = resources.filter(r =>
            r.resourceType === 'ngo' ||
            (r.organization && r.organization.includes('NGO'))
        );

        const otherResources = resources.filter(r =>
            !vaResources.includes(r) && !ngoResources.includes(r)
        );

        // Sort each group deterministically but differently for each selection
        const sortedVA = [...vaResources].sort((a, b) => {
            const aVal = ((a.id?.charCodeAt(0) || 0) * seedNum) % 100;
            const bVal = ((b.id?.charCodeAt(0) || 0) * seedNum) % 100;
            return aVal - bVal;
        });

        const sortedNGO = [...ngoResources].sort((a, b) => {
            const aVal = ((a.id?.charCodeAt(0) || 0) * (seedNum + 7)) % 100;
            const bVal = ((b.id?.charCodeAt(0) || 0) * (seedNum + 7)) % 100;
            return aVal - bVal;
        });

        const sortedOther = [...otherResources].sort((a, b) => {
            const aVal = ((a.id?.charCodeAt(0) || 0) * (seedNum + 13)) % 100;
            const bVal = ((b.id?.charCodeAt(0) || 0) * (seedNum + 13)) % 100;
            return aVal - bVal;
        });

        // For crisis/severe, prioritize VA resources
        if (severityLevel === 'severe' || severityLevel === 'crisis') {
            return [
                ...sortedVA.slice(0, Math.min(5, sortedVA.length)),
                ...sortedNGO.slice(0, Math.min(3, sortedNGO.length)),
                ...sortedVA.slice(5, Math.min(10, sortedVA.length)),
                ...sortedOther.slice(0, Math.min(3, sortedOther.length)),
                ...sortedNGO.slice(3),
                ...sortedVA.slice(10),
                ...sortedOther.slice(3)
            ];
        }

        // For mild/moderate symptoms, interleave resources
        const result: HealthResource[] = [];
        const maxPerGroup = 10;

        for (let i = 0; i < maxPerGroup; i++) {
            if (i < sortedVA.length) result.push(sortedVA[i]);
            if (i < sortedNGO.length) result.push(sortedNGO[i]);
            if (i < sortedOther.length) result.push(sortedOther[i]);
        }

        // Add any remaining resources
        return [
            ...result,
            ...sortedVA.slice(maxPerGroup),
            ...sortedNGO.slice(maxPerGroup),
            ...sortedOther.slice(maxPerGroup)
        ];
    }

    return {
        findMatchingResources,
        isLoading
    };
} 