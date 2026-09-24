// ignore-build.js: Used by Vercel's "Ignored Build Step"
// In Vercel: Exit 0 = CANCEL/SKIP deployment; Exit 1 = PROCEED with deployment.
const branch = process.env.VERCEL_GIT_COMMIT_REF;

if (branch && branch !== "main") {
  console.log(`🛑 Skipping deployment for non-main branch: "${branch}". Only the "main" branch is deployed.`);
  process.exit(0); // Skip deployment
} else {
  console.log(`✅ Proceeding with deployment for branch: "${branch || "main"}"`);
  process.exit(1); // Proceed with build
}
