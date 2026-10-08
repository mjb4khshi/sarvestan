// devDatasetLoader.js
// Loads devDataset.js if present locally on disk, otherwise safely falls back to empty defaults.
// This allows devDataset.js to be safely .gitignored without breaking CI/CD or fresh clones.

const modules = import.meta.glob('./devDataset.js', { eager: true });
const devDataset = modules['./devDataset.js']?.default || {
  profile: {},
  courses: [],
  schedule: {},
  exams: {},
  transcripts: {},
  finance: {},
  curriculumStats: {},
};

export default devDataset;
