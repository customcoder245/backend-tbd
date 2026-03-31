/**
 * Vercel Speed Insights Integration
 * 
 * Speed Insights is a client-side performance monitoring tool that measures Web Vitals.
 * This module provides utilities for integrating Speed Insights with this backend.
 * 
 * IMPORTANT: Speed Insights is designed for frontend applications and measures
 * client-side metrics like LCP, FID, CLS, FCP, and TTFB.
 * 
 * Usage scenarios:
 * 1. If serving HTML pages: Include the script tag in your HTML templates
 * 2. If consumed by a frontend: The frontend should install @vercel/speed-insights
 * 3. For API monitoring: Consider using Vercel's observability features (Logs, Tracing)
 * 
 * Documentation: https://vercel.com/docs/speed-insights/quickstart
 */

/**
 * Get the Speed Insights script tag for injection into HTML responses
 * 
 * @returns {string} HTML script tag for Speed Insights
 * 
 * @example
 * // In an HTML response:
 * res.send(`
 *   <!DOCTYPE html>
 *   <html>
 *     <head>
 *       <title>My App</title>
 *     </head>
 *     <body>
 *       <h1>Hello World</h1>
 *       ${getSpeedInsightsScript()}
 *     </body>
 *   </html>
 * `);
 */
export function getSpeedInsightsScript() {
  // Vercel automatically injects Speed Insights when enabled in dashboard
  // and the package is installed. This is a manual fallback option.
  return `<script defer src="/_vercel/speed-insights/script.js"></script>`;
}

/**
 * Express middleware to add Speed Insights information to responses
 * 
 * This middleware adds headers that can be used by frontend clients
 * to understand that Speed Insights is available.
 * 
 * @example
 * import { speedInsightsMiddleware } from './utils/speedInsights.js';
 * app.use(speedInsightsMiddleware);
 */
export function speedInsightsMiddleware(req, res, next) {
  // Add a custom header to indicate Speed Insights is configured
  res.setHeader('X-Speed-Insights-Enabled', 'true');
  next();
}

/**
 * Helper to check if running on Vercel with Speed Insights enabled
 * 
 * @returns {boolean} True if running on Vercel
 */
export function isSpeedInsightsEnabled() {
  return process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
}

export default {
  getSpeedInsightsScript,
  speedInsightsMiddleware,
  isSpeedInsightsEnabled
};
