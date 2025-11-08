# **App Name**: Resilient Echo

## Core Features:

- Multimedia Report Upload: Allow users to upload reports with photos, audio, geolocation, and text descriptions to signal a climate threat.
- Client-Side AI Triage: Employ on-device AI using TensorFlow.js, Essentia.js or Vosk, spaCy.js or Compromise and YOLOv8 to analyze uploaded media and automatically detect potential climate threats and extract essential needs from the data. Output a confidence score.
- Personalized Push Alerts: Send personalized and inclusive push notifications via Firebase Cloud Messaging (FCM) to alert nearby residents, registered volunteers, and simulated authorities about detected threats and urgent needs.
- Volunteer Pledge System: Establish a system where individuals, hotels, and restaurants can pledge resources like food, shelter, transport, and skills. The AI will then tool auto-match these pledges to verified needs, prioritizing by urgency and proximity, as derived by media uploaded by other users.
- Map Dashboard: Create a map dashboard using Leaflet.js and OpenStreetMap to visualize real-time reports and available pledges, providing an overview of the situation.
- Offline Mode: Implement offline functionality using Workbox and IndexedDB to allow users to submit reports and view available pledges even without an active internet connection.
- Human-in-the-Loop Flag Button: Incorporate a "flag" button feature, allowing for human oversight and manual review of AI-assessed reports and recommended matches.

## Style Guidelines:

- Primary color: Deep green (#336633) to represent nature, resilience, and sustainability.
- Background color: Light beige (#F5F5DC), a desaturated tint of deep green, creating a calming and natural backdrop.
- Accent color: Warm orange (#FF8C00) for alerts and interactive elements, providing a clear and urgent contrast to the green and beige.
- Body and headline font: 'PT Sans', a humanist sans-serif font combining modernity and warmth for clear and accessible communication.
- Code font: 'Source Code Pro' for displaying setup code snippets.
- Utilize clear and recognizable icons to represent different climate threats (e.g., flood, fire, storm) and needs (e.g., food, shelter, evacuation). Adopt a simple, universally understood style.
- Employ a clean and intuitive layout that prioritizes ease of use, particularly for those in urgent situations. Make sure the map dashboard is prominently displayed and interactive.
- Use subtle animations for alerts and notifications to draw attention without overwhelming the user. For example, gently pulsing markers on the map for new reports.