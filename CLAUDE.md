# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Medical experiment randomization tool for the Ultrasonographic Compressibility Validation Study. Generates stratified randomization assignments for participants across multiple sessions and measurement modalities.

**Repository:** https://github.com/gusevm1/medicalshuffle.git
**Production:** Deployed via Vercel (auto-deploys on push to main)

## Web Application (Primary Interface)

### Running the Web App

```bash
cd medicalshuffle
npm install
npm run dev
```

The app runs at `http://localhost:3000`

### Building for Production

```bash
cd medicalshuffle
npm run build
npm start
```

### Tech Stack

- **Framework:** Next.js 16 with React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** Firebase Firestore (with localStorage fallback)
- **Deployment:** Vercel

## Architecture

### Web Application Structure (`/medicalshuffle`)

- `src/lib/randomization.ts` - Core randomization logic, data migration, Firestore operations
- `src/lib/firebase.ts` - Firebase configuration
- `src/components/` - React components
  - `ExperimentForm.tsx` - Input form for participant counts
  - `ParticipantCard.tsx` - Collapsible view of participant randomizations
  - `ExportButtons.tsx` - JSON/CSV/Summary export functionality
  - `SummaryStats.tsx` - Experiment statistics display
  - `ThemeToggle.tsx` - Dark/light mode toggle
  - `PasswordGate.tsx` - Authentication component
- `src/app/page.tsx` - Main application page with auth and data management

## Experiment Design

### Structure Overview

1. **Participants** - Each assigned a unique `recordId` and `randomSeed` for reproducibility
2. **Sessions** (3 per participant) - ALL IDENTICAL (randomized ONCE, then copied to all 3)
3. **Modalities** (2 per session):
   - Ultrasound (40 measurements)
   - Palpation (40 measurements)
4. **Model Types** (2 per modality):
   - **Ball Models:** 4 colored spheres (S1-S4)
   - **Balloon Models:** 4 named balloons (B1-B4)
5. **Cycle Structure:** 5 repetitions × 4 models = 20 measurements per model type
6. **Total:** 80 measurements per session × 3 sessions = **240 per participant**

### Ball Models (Spheres)

| ID | Name | Color (Hex) | Display |
|----|------|-------------|---------|
| S1 | Yellow | #EAB308 | Colored text |
| S2 | Green | #22C55E | Colored text |
| S3 | Red | #EF4444 | Colored text |
| S4 | Blue | #3B82F6 | Colored text |

### Balloon Models

| ID | Name |
|----|------|
| B1 | Balloon 1 |
| B2 | Balloon 2 |
| B3 | Balloon 3 |
| B4 | Balloon 4 |

## Randomization Logic

### Randomization Layers (Per Participant)

| Layer | What Gets Randomized | Scope |
|-------|---------------------|-------|
| Modality Order | Ultrasound vs Palpation | Per participant (all sessions identical) |
| Model Type Order | Ball vs Balloon | Per participant (all sessions identical) |
| Ball Sphere Order | 4 spheres shuffled (S1-S4) | Per participant (all sessions identical) |
| Balloon Order | 4 balloons shuffled (B1-B4) | Per participant (all sessions identical) |

### Critical: Modality-Specific Randomization Behavior

**This is a key design decision:**

| Modality | Ball Models | Balloon Models |
|----------|-------------|----------------|
| **Ultrasound** | FIXED order across all 5 repetitions | FIXED order across all 5 repetitions |
| **Palpation** | INDEPENDENTLY RANDOMIZED for each of 5 repetitions | INDEPENDENTLY RANDOMIZED for each of 5 repetitions |

#### Example - Ultrasound (Fixed Order)
```
Rep 1: Yellow → Green → Red → Blue
Rep 2: Yellow → Green → Red → Blue
Rep 3: Yellow → Green → Red → Blue
Rep 4: Yellow → Green → Red → Blue
Rep 5: Yellow → Green → Red → Blue
```

#### Example - Palpation (Random Per Rep)
```
Rep 1: Green → Blue → Yellow → Red
Rep 2: Red → Yellow → Blue → Green
Rep 3: Blue → Green → Red → Yellow
Rep 4: Yellow → Red → Green → Blue
Rep 5: Green → Red → Blue → Yellow
```

### Key Functions in `randomization.ts`

- `generateCycleMeasurements()` - Creates measurements with FIXED order (for Ultrasound)
- `generateRandomizedCycleMeasurements()` - Creates measurements with RANDOM order per rep (for Palpation)
- `generateSession()` - Builds a complete session, applying appropriate randomization based on modality
- `generateParticipantRandomization()` - Creates full participant data with seeded RNG
- `createSeededRandom()` - Mulberry32 PRNG for reproducibility
- `shuffleArray()` - Fisher-Yates shuffle with seeded random

## Data Persistence

### Storage Strategy

1. **Primary:** Firebase Firestore (`experiments/main` document)
2. **Fallback:** Browser localStorage
3. **Timeout:** 10-second timeout on Firestore operations

### Data Migration

The `migrateData()` function automatically converts old data formats when loading:

| Old Format | New Format |
|------------|------------|
| `balloonPointOrder` | `balloonOrder` |
| `P1, P2, P3, P4` (IDs) | `B1, B2, B3, B4` |
| Pressure values (e.g., "45 mmHg") | Named balloons ("Balloon 1") |
| `Sphere 1, 2, 3, 4` | `Yellow, Green, Red, Blue` |
| Missing `color` field | Added with appropriate hex value |

### Key Interfaces

```typescript
interface BallModel {
  id: string;      // S1, S2, S3, S4
  name: string;    // Yellow, Green, Red, Blue
  color: string;   // Hex color code
  order: number;
}

interface BalloonModel {
  id: string;      // B1, B2, B3, B4
  name: string;    // Balloon 1, 2, 3, 4
  order: number;
}

interface Measurement {
  repetition: number;  // 1-5
  modelOrder: number;  // 1-4
  modelId: string;
  modelName: string;
  color?: string;      // Only for ball models
}

interface Session {
  sessionNumber: 1 | 2 | 3;
  modalityOrder: ['ultrasound', 'palpation'] | ['palpation', 'ultrasound'];
  modelTypeOrder: ['ball', 'balloon'] | ['balloon', 'ball'];
  ballSphereOrder: string[];
  balloonOrder: string[];
  modalities: ModalityBlock[];
  totalMeasurements: number;
}
```

## Key Design Principles

1. **Reproducibility** - Each participant has a stored `randomSeed` for exact recreation
2. **Session Consistency** - Sessions 1, 2, 3 are IDENTICAL (randomized once, copied)
3. **Modality Differentiation** - Palpation has per-repetition randomization, Ultrasound does not
4. **Counterbalancing** - All high-level orders randomized to control for sequence effects
5. **Independent Randomization** - Ball and Balloon orders randomized separately
6. **Backward Compatibility** - Data migration handles old formats automatically
7. **Offline Support** - localStorage fallback when Firestore unavailable

## Authentication

- Password-protected access via environment variable `NEXT_PUBLIC_SITE_PASSWORD`
- Fallback password: `hamsandwich1943` (for development)

## Recent Changes (Latest First)

1. **Balloon Models Refactor** - Replaced random pressure values (1-100 mmHg) with fixed named models (Balloon 1-4)
2. **Color Names for Spheres** - Changed Sphere 1-4 to Yellow/Green/Red/Blue with colored display
3. **Palpation Per-Rep Randomization** - Each repetition in Palpation modality now has independently randomized model order
4. **Data Migration System** - Automatic conversion of old data formats on load

## Legacy CLI Tools (`/Rahel statistics`)

The original Python scripts are retained for reference but the web interface is now the primary tool.

```bash
# Generate experiment data (legacy)
python "Rahel statistics/create_experiment_tree.py" --students 8 --residents 10 --attendings 7 -o experiment_data.json

# Convert JSON to Excel (legacy)
python "Rahel statistics/convert_json_data_to_excel.py" -i experiment_data.json -o experiment_data.xlsx
```

Requires: `pandas`, `openpyxl` for Excel conversion.
