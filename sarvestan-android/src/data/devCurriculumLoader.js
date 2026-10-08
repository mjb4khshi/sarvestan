// devCurriculumLoader.js
// Loads devCurriculumReport.js if present locally, otherwise safely falls back to empty defaults.
const modules = import.meta.glob('./devCurriculumReport.js', { eager: true });
const devCurriculumReport = modules['./devCurriculumReport.js']?.default || null;
export default devCurriculumReport;
