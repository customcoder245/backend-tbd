// ====================================================
// ✅ TESTING MODE — 1 minute cycle (active)
// ====================================================
// export const ASSESSMENT_CYCLE_MONTHS = 3; // kept for imports that reference it

// export const getAssessmentCycleStartDate = () => {
//     const date = new Date();
//     date.setSeconds(date.getSeconds() - 30); // ⏱ 30 seconds for testing
//     return date;
// };

// ====================================================
// 🚀 PRODUCTION MODE — 3 month cycle (commented out)
// ====================================================
export const ASSESSMENT_CYCLE_MONTHS = 3;

export const getAssessmentCycleStartDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - ASSESSMENT_CYCLE_MONTHS);
    return date;
};

