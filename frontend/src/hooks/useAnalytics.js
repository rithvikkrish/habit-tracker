import { useEffect } from 'react';

const useAnalytics = () => {
    useEffect(() => {
        // Initialize analytics service here
        console.log('Analytics service initialized');

        return () => {
            // Cleanup on unmount
            console.log('Analytics service cleaned up');
        };
    }, []);

    const trackEvent = (eventName, eventData) => {
        // Send event to analytics service
        console.log(`Event tracked: ${eventName}`, eventData);
    };

    return { trackEvent };
};

export default useAnalytics;