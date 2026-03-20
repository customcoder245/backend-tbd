// Mock report data fetch function (replace with actual logic)
export const getReportData = async (userId, selectedDomain, selectedSubdomain) => {
    try {
        // For now, we mock the data based on the selected domain and subdomain
        const mockReportData = {
            overallScore: 85,
            insights: ['Insight 1', 'Insight 2', 'Insight 3'],
            keyResults: ['KR 1', 'KR 2', 'KR 3'],
        };
        // Replace this with your database query logic
        return mockReportData;
    } catch (error) {
        console.error('Error fetching report data:', error);
        throw new Error('Report data not found');
    }
};