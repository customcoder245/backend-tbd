# Vercel Speed Insights Setup

This project has been configured with Vercel Speed Insights support.

## What is Speed Insights?

Speed Insights is a client-side web performance monitoring tool that measures Core Web Vitals:
- **LCP (Largest Contentful Paint)**: Loading performance
- **FID (First Input Delay)**: Interactivity
- **CLS (Cumulative Layout Shift)**: Visual stability
- **FCP (First Contentful Paint)**: First paint timing
- **TTFB (Time to First Byte)**: Server response time

## Package Installed

✅ `@vercel/speed-insights` v2.0.0 has been added to the project dependencies.

## Backend Configuration

Since this is a Node.js Express backend API, the following has been configured:

### 1. Utility Module (`src/utils/speedInsights.js`)

A utility module has been created that provides:
- `getSpeedInsightsScript()`: Returns the script tag for HTML injection
- `speedInsightsMiddleware`: Express middleware that adds Speed Insights headers
- `isSpeedInsightsEnabled()`: Check if running on Vercel

### 2. Middleware Integration (`src/app.js`)

The Speed Insights middleware has been added to the Express app, which adds an `X-Speed-Insights-Enabled` header to all responses.

### 3. Configuration Endpoint

A new endpoint is available at `/api/v1/speed-insights/config` that returns:
```json
{
  "success": true,
  "speedInsightsEnabled": true,
  "message": "Speed Insights is configured...",
  "documentation": "https://vercel.com/docs/speed-insights/quickstart"
}
```

## Frontend Integration

If you have a frontend application that consumes this API, you should:

### For React/Next.js Applications:

1. Install the package in your frontend:
```bash
npm install @vercel/speed-insights
```

2. Add to your React application:
```javascript
import { SpeedInsights } from '@vercel/speed-insights/react';

function App() {
  return (
    <>
      {/* Your app content */}
      <SpeedInsights />
    </>
  );
}
```

3. For Next.js App Router (v13.5+), add to your root layout:
```javascript
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

## Enabling Speed Insights on Vercel

1. Go to your project in the Vercel Dashboard
2. Navigate to the "Speed Insights" tab
3. Enable Speed Insights for your project
4. Deploy your application

## Viewing Metrics

Once enabled and deployed:
1. Visit your deployed application
2. Navigate through different pages to generate data
3. View metrics in the Vercel Dashboard under "Speed Insights"

## Important Notes

- **Speed Insights is a client-side tool** - it measures frontend performance, not backend API performance
- For backend/API monitoring, consider using Vercel's Logs, Tracing, and Monitoring features
- Speed Insights data appears after real users visit your deployed site
- The tool requires deployment on Vercel to function properly

## Documentation

- [Speed Insights Quickstart](https://vercel.com/docs/speed-insights/quickstart)
- [Speed Insights Package](https://vercel.com/docs/speed-insights/package)
- [Web Vitals](https://web.dev/vitals/)

## Support

For issues or questions about Speed Insights, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
