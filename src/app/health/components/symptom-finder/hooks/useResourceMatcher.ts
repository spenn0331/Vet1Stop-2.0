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
        console.log(`%c[SRF] %cFinding resources for category: %c${categoryId}%c, symptoms: %c${symptoms.join(', ')}%c, severity: %c${severityLevel}`,
            'color:#0066cc;font-weight:bold', 'color:black', 'color:#009933;font-weight:bold',
            'color:black', 'color:#009933;font-weight:bold', 'color:black', 'color:#009933;font-weight:bold');

        try {
            // First try to fetch from API
            let resources: HealthResource[] = [];

            try {
                // Create parameters for the health-resources API
                const params = new URLSearchParams();

                // Use correct parameter name for symptom category
                params.append('symptomCategory', categoryId);

                // Add symptoms as comma-separated list
                if (symptoms.length > 0) {
                    params.append('symptoms', symptoms.join(','));
                }

                // Add severity level
                if (severityLevel) {
                    params.append('severityLevel', severityLevel);
                }

                // Add unique selection hash for deterministic but varied results
                // This is important to ensure different combinations get different resources
                const uniqueId = selectionHash ||
                    `${categoryId}_${symptoms.join(',')}_${severityLevel}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
                params.append('selectionHash', uniqueId);

                // Log the API request
                console.log(`%c[SRF] %cFetching from API: %c/api/health-resources?${params.toString()}`,
                    'color:#0066cc;font-weight:bold', 'color:black', 'color:#6600cc');

                const response = await fetch(`/api/health-resources?${params.toString()}`);

                if (response.ok) {
                    const data = await response.json();
                    console.log('%c[SRF] %cAPI response received: %o', 'color:#0066cc;font-weight:bold', 'color:black', data);

                    // Check for 'data' field which is the standard format for this API
                    if (data && data.data && Array.isArray(data.data)) {
                        resources = data.data;
                        console.log(`%c[SRF] %cReceived %c${resources.length} %cresources from API`,
                            'color:#0066cc;font-weight:bold', 'color:black', 'color:#009933;font-weight:bold', 'color:black');
                    }
                    // Also handle alternative formats for backward compatibility
                    else if (data && data.resources && Array.isArray(data.resources)) {
                        resources = data.resources;
                        console.log(`%c[SRF] %cReceived %c${resources.length} %cresources from API (alternative format)`,
                            'color:#0066cc;font-weight:bold', 'color:black', 'color:#009933;font-weight:bold', 'color:black');
                    }
                    // Check for empty results
                    else {
                        console.log('%c[SRF] %cAPI returned empty or unexpected response format: %o',
                            'color:#0066cc;font-weight:bold', 'color:black', data);
                        resources = [];
                    }
                } else {
                    console.error(`%c[SRF] %cAPI request failed: %c${response.status} - ${response.statusText}`,
                        'color:#0066cc;font-weight:bold', 'color:#cc0000', 'color:#cc0000;font-weight:bold');
                    resources = [];
                }
            } catch (error) {
                console.error('%c[SRF] %cError fetching from API: %o',
                    'color:#0066cc;font-weight:bold', 'color:#cc0000', error);
                resources = [];
            }

            // If API returned resources, use them
            if (resources.length > 0) {
                console.log(`%c[SRF] %cUsing %c${resources.length} %cresources from API`,
                    'color:#0066cc;font-weight:bold', 'color:black', 'color:#009933;font-weight:bold', 'color:black');
                // Process and return resources
                const processedResources = ensureDiverseResults(resources, categoryId, symptoms, severityLevel);
                setIsLoading(false);
                return processedResources;
            }

            // API returned no resources, use local filtering
            console.log('%c[SRF] %cAPI returned no resources, falling back to local filtering',
                'color:#0066cc;font-weight:bold', 'color:#cc6600;font-weight:bold');
            const locallyFilteredResources = filterResourcesLocally(allResources, categoryId, symptoms, severityLevel);
            console.log(`%c[SRF] %cLocal filtering returned %c${locallyFilteredResources.length} %cresources`,
                'color:#0066cc;font-weight:bold', 'color:black', 'color:#009933;font-weight:bold', 'color:black');

            // Process and return results
            const processedResources = ensureDiverseResults(locallyFilteredResources, categoryId, symptoms, severityLevel);
            setIsLoading(false);
            return processedResources;
        } catch (error) {
            console.error('%c[SRF] %cError in findMatchingResources: %o',
                'color:#0066cc;font-weight:bold', 'color:#cc0000', error);
            // Final fallback - use basic local filtering
            setIsLoading(false);
            return filterResourcesLocally(allResources, categoryId, symptoms, severityLevel);
        }
    }, [allResources]);

    /**
     * Local filtering function for when API call fails
     */
    function filterResourcesLocally(
        resources: HealthResource[],
        categoryId: string,
        symptoms: string[],
        severityLevel: string | null,
        seed?: string
    ): HealthResource[] {
        console.log('%c[SRF] %cFiltering resources locally', 'color:#0066cc;font-weight:bold', 'color:#cc6600');

        // Generate a seed number for deterministic shuffling
        const seedNum = seed?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;

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
            console.log('%c[SRF] %cToo few results, relaxing criteria', 'color:#0066cc;font-weight:bold', 'color:#cc6600');
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
            console.log('%c[SRF] %cStill too few results, returning top-rated resources', 'color:#0066cc;font-weight:bold', 'color:#cc6600');
            return resources.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);
        }

        console.log(`%c[SRF] %cLocal filtering found %c${filtered.length} %cmatching resources`,
            'color:#0066cc;font-weight:bold', 'color:black', 'color:#009933;font-weight:bold', 'color:black');
        return filtered;
    }

    /**
     * Balance resources to have a good mix of VA and non-VA resources
     */
    function ensureDiverseResults(
        resources: HealthResource[],
        categoryId: string | null,
        symptoms: string[],
        severityLevel: string | null,
        seed?: string
    ): HealthResource[] {
        if (resources.length === 0) return [];

        // Seed for deterministic but varied results
        const seedNum = seed?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;

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

        console.log(`%c[SRF] %cDiversifying results: %c${vaResources.length} VA%c, %c${ngoResources.length} NGO%c, %c${otherResources.length} Other`,
            'color:#0066cc;font-weight:bold', 'color:black',
            'color:#009933;font-weight:bold', 'color:black',
            'color:#009933;font-weight:bold', 'color:black',
            'color:#009933;font-weight:bold');

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
            console.log(`%c[SRF] %cUsing crisis/severe balancing (VA priority) for %c${severityLevel}%c severity`,
                'color:#0066cc;font-weight:bold', 'color:black', 'color:#cc0000;font-weight:bold', 'color:black');

            const result = [
                ...sortedVA.slice(0, Math.min(5, sortedVA.length)),
                ...sortedNGO.slice(0, Math.min(3, sortedNGO.length)),
                ...sortedVA.slice(5, Math.min(10, sortedVA.length)),
                ...sortedOther.slice(0, Math.min(3, sortedOther.length)),
                ...sortedNGO.slice(3),
                ...sortedVA.slice(10),
                ...sortedOther.slice(3)
            ];

            const vaCount = result.filter(r =>
                r.resourceType === 'va' ||
                (r.organization && r.organization.includes('Veterans Affairs'))
            ).length;

            const ngoCount = result.filter(r =>
                r.resourceType === 'ngo' ||
                (r.organization && r.organization.includes('NGO'))
            ).length;

            console.log(`%c[SRF] %cBalanced result: %c${result.length} total%c (%c${vaCount} VA%c, %c${ngoCount} NGO%c)`,
                'color:#0066cc;font-weight:bold', 'color:black',
                'color:#009933;font-weight:bold', 'color:black',
                'color:#009933;font-weight:bold', 'color:black',
                'color:#009933;font-weight:bold', 'color:black');

            return result;
        }

        // For mild/moderate symptoms, interleave resources with more NGO representation
        console.log(`%c[SRF] %cUsing standard balancing (NGO priority) for %c${severityLevel}%c severity`,
            'color:#0066cc;font-weight:bold', 'color:black', 'color:#009933;font-weight:bold', 'color:black');

        const result: HealthResource[] = [];
        const maxPerGroup = 10;

        for (let i = 0; i < maxPerGroup; i++) {
            // Add NGO resources first
            if (i < sortedNGO.length) result.push(sortedNGO[i]);
            // Then add VA resources every other iteration to reduce their frequency
            if (i % 2 === 0 && i / 2 < sortedVA.length) result.push(sortedVA[Math.floor(i / 2)]);
            // Then add other resources
            if (i < sortedOther.length) result.push(sortedOther[i]);
        }

        // Add any remaining resources
        const finalResult = [
            ...result,
            ...sortedVA.slice(Math.ceil(maxPerGroup / 2)),
            ...sortedNGO.slice(maxPerGroup),
            ...sortedOther.slice(maxPerGroup)
        ];

        const vaCount = finalResult.filter(r =>
            r.resourceType === 'va' ||
            (r.organization && r.organization.includes('Veterans Affairs'))
        ).length;

        const ngoCount = finalResult.filter(r =>
            r.resourceType === 'ngo' ||
            (r.organization && r.organization.includes('NGO'))
        ).length;

        console.log(`%c[SRF] %cBalanced result: %c${finalResult.length} total%c (%c${vaCount} VA%c, %c${ngoCount} NGO%c)`,
            'color:#0066cc;font-weight:bold', 'color:black',
            'color:#009933;font-weight:bold', 'color:black',
            'color:#009933;font-weight:bold', 'color:black',
            'color:#009933;font-weight:bold', 'color:black');

        return finalResult;
    }

    return {
        findMatchingResources,
        isLoading
    };
} 