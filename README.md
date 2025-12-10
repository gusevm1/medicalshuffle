# Medical Shuffle

A web application for generating stratified randomization assignments for medical research experiments. Built for the Ultrasonographic Compressibility Validation Study.

## Overview

Medical Shuffle generates randomized experiment sequences for participants across multiple sessions and measurement modalities. It ensures proper counterbalancing and reproducibility through seeded randomization.

### Key Features

- Stratified randomization for research participants
- Reproducible sequences via stored random seeds
- Real-time data persistence with Firebase Firestore
- Export to JSON, CSV, and Markdown summary formats
- Dark/light theme support

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **UI**: React 19

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/gusevm1/medicalshuffle.git
   cd medicalshuffle
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_SITE_PASSWORD=your_site_password
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

The project is configured for automatic deployment via Vercel. Simply push to the `main` branch to trigger a production deployment.

```bash
git push origin main
```

## Experiment Design

Each participant receives:
- 3 identical sessions (randomized once, then copied)
- 2 modalities per session: Ultrasound & Palpation
- 2 model types per modality: Ball (4 spheres) & Balloon (4 pressure points)
- 5 repetitions per model (cycle structure)
- 80 measurements per session = 240 total per participant

## License

Private - All rights reserved.
