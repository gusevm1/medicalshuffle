/**
 * Experiment Randomization Logic
 *
 * Based on EXPERIMENT_DESIGN.md:
 * - 3 identical sessions per participant (randomized ONCE, copied to all)
 * - 2 modalities: Ultrasound, Palpation (randomized order)
 * - 2 model types per modality: Ball Models (4 spheres), Balloon Model (4 pressure points)
 * - Cycle structure: 5 repetitions of all 4 models
 * - 80 measurements per session = 240 total per participant
 */

export interface BallModel {
  id: string;
  name: string;
  order: number;
}

export interface BalloonPressurePoint {
  id: string;
  pressure: number; // 1-100 mmHg
  order: number;
}

export interface ModelTypeBlock {
  modelType: 'ball' | 'balloon';
  order: number;
  models: BallModel[] | BalloonPressurePoint[];
  measurements: Measurement[];
}

export interface Measurement {
  repetition: number; // 1-5
  modelOrder: number; // 1-4
  modelId: string;
  modelName: string;
}

export interface ModalityBlock {
  modality: 'ultrasound' | 'palpation';
  order: number;
  ballBlock: ModelTypeBlock;
  balloonBlock: ModelTypeBlock;
}

export interface Session {
  sessionNumber: 1 | 2 | 3;
  modalityOrder: ['ultrasound', 'palpation'] | ['palpation', 'ultrasound'];
  modelTypeOrder: ['ball', 'balloon'] | ['balloon', 'ball'];
  ballSphereOrder: string[];
  balloonPointOrder: string[];
  modalities: ModalityBlock[];
  totalMeasurements: number;
}

export interface Participant {
  recordId: number;
  randomSeed: number;
  sessions: [Session, Session, Session];
}

export interface ExperimentData {
  generatedAt: string;
  participants: Participant[];
  summary: {
    totalParticipants: number;
    measurementsPerSession: number;
    measurementsPerParticipant: number;
    totalMeasurements: number;
  };
}

// Seeded random number generator (Mulberry32)
function createSeededRandom(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle with seeded random
function shuffleArray<T>(array: T[], random: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate random integer in range [min, max] inclusive
function randomInt(min: number, max: number, random: () => number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

// Generate 4 unique random pressure values (1-100) with minimum 10mmHg separation
function generateUniquePressures(random: () => number): number[] {
  const pressures: number[] = [];
  const MIN_SEPARATION = 10;
  const maxAttempts = 1000;
  let attempts = 0;

  while (pressures.length < 4 && attempts < maxAttempts) {
    const candidate = randomInt(1, 100, random);
    attempts++;

    // Check if candidate is at least 10mmHg away from all existing pressures
    const isFarEnough = pressures.every(
      existing => Math.abs(candidate - existing) >= MIN_SEPARATION
    );

    if (isFarEnough) {
      pressures.push(candidate);
    }
  }

  // Fallback: if we couldn't find 4 values with random generation,
  // use evenly spaced values (10, 35, 60, 85) shuffled
  if (pressures.length < 4) {
    const fallbackPressures = [10, 35, 60, 85];
    return shuffleArray(fallbackPressures, random);
  }

  return pressures;
}

// Ball sphere definitions
const BALL_SPHERES = [
  { id: 'S1', name: 'Sphere 1' },
  { id: 'S2', name: 'Sphere 2' },
  { id: 'S3', name: 'Sphere 3' },
  { id: 'S4', name: 'Sphere 4' },
];

// Generate measurements for a model type using cycle structure
function generateCycleMeasurements(
  modelIds: string[],
  modelNames: string[],
  repetitions: number = 5
): Measurement[] {
  const measurements: Measurement[] = [];

  for (let rep = 1; rep <= repetitions; rep++) {
    for (let order = 0; order < modelIds.length; order++) {
      measurements.push({
        repetition: rep,
        modelOrder: order + 1,
        modelId: modelIds[order],
        modelName: modelNames[order],
      });
    }
  }

  return measurements;
}

// Generate a complete session based on randomization
function generateSession(
  sessionNumber: 1 | 2 | 3,
  modalityOrder: ['ultrasound', 'palpation'] | ['palpation', 'ultrasound'],
  modelTypeOrder: ['ball', 'balloon'] | ['balloon', 'ball'],
  ballSphereOrder: string[],
  balloonPoints: BalloonPressurePoint[]
): Session {
  const modalities: ModalityBlock[] = [];

  for (let i = 0; i < modalityOrder.length; i++) {
    const modality = modalityOrder[i];

    // Create ball models block
    const ballModels: BallModel[] = ballSphereOrder.map((sphereId, idx) => {
      const sphere = BALL_SPHERES.find(s => s.id === sphereId)!;
      return {
        id: sphereId,
        name: sphere.name,
        order: idx + 1,
      };
    });

    const ballMeasurements = generateCycleMeasurements(
      ballSphereOrder,
      ballModels.map(m => m.name)
    );

    // Create balloon models block
    const balloonMeasurements = generateCycleMeasurements(
      balloonPoints.map(p => p.id),
      balloonPoints.map(p => `${p.pressure} mmHg`)
    );

    const ballBlock: ModelTypeBlock = {
      modelType: 'ball',
      order: modelTypeOrder[0] === 'ball' ? 1 : 2,
      models: ballModels,
      measurements: ballMeasurements,
    };

    const balloonBlock: ModelTypeBlock = {
      modelType: 'balloon',
      order: modelTypeOrder[0] === 'balloon' ? 1 : 2,
      models: balloonPoints,
      measurements: balloonMeasurements,
    };

    modalities.push({
      modality,
      order: i + 1,
      ballBlock,
      balloonBlock,
    });
  }

  return {
    sessionNumber,
    modalityOrder,
    modelTypeOrder,
    ballSphereOrder,
    balloonPointOrder: balloonPoints.map(p => p.id),
    modalities,
    totalMeasurements: 80, // 2 modalities × 2 model types × 4 models × 5 reps
  };
}

// Generate randomization for a single participant
function generateParticipantRandomization(
  recordId: number,
  randomSeed: number
): Participant {
  const random = createSeededRandom(randomSeed);

  // Layer 1: Randomize modality order (Ultrasound vs Palpation)
  const modalities: ['ultrasound', 'palpation'] = ['ultrasound', 'palpation'];
  const modalityOrder = shuffleArray(modalities, random) as ['ultrasound', 'palpation'] | ['palpation', 'ultrasound'];

  // Layer 2: Randomize model type order (Ball vs Balloon)
  const modelTypes: ['ball', 'balloon'] = ['ball', 'balloon'];
  const modelTypeOrder = shuffleArray(modelTypes, random) as ['ball', 'balloon'] | ['balloon', 'ball'];

  // Layer 3: Randomize ball sphere order
  const ballSphereIds = BALL_SPHERES.map(s => s.id);
  const ballSphereOrder = shuffleArray(ballSphereIds, random);

  // Layer 4: Generate and randomize balloon pressure points (independent from ball)
  const pressures = generateUniquePressures(random);
  const balloonPointIds = ['P1', 'P2', 'P3', 'P4'];
  const shuffledBalloonIds = shuffleArray(balloonPointIds, random);

  const balloonPoints: BalloonPressurePoint[] = shuffledBalloonIds.map((id, idx) => ({
    id,
    pressure: pressures[idx],
    order: idx + 1,
  }));

  // Generate identical sessions (randomized ONCE, copied to all 3)
  const baseSession = generateSession(1, modalityOrder, modelTypeOrder, ballSphereOrder, balloonPoints);

  const sessions: [Session, Session, Session] = [
    { ...baseSession, sessionNumber: 1 },
    { ...baseSession, sessionNumber: 2 },
    { ...baseSession, sessionNumber: 3 },
  ];

  return {
    recordId,
    randomSeed,
    sessions,
  };
}

// Main function to generate experiment data
export function generateExperimentData(
  totalParticipants: number
): ExperimentData {
  if (totalParticipants <= 0) {
    throw new Error('Total number of participants must be positive');
  }

  // Generate participants
  const participants: Participant[] = [];
  const globalRandom = createSeededRandom(Date.now());

  for (let i = 0; i < totalParticipants; i++) {
    const recordId = i + 1;
    const randomSeed = Math.floor(globalRandom() * 1000000);

    const participant = generateParticipantRandomization(recordId, randomSeed);
    participants.push(participant);
  }

  const measurementsPerSession = 80;
  const measurementsPerParticipant = measurementsPerSession * 3;

  return {
    generatedAt: new Date().toISOString(),
    participants,
    summary: {
      totalParticipants,
      measurementsPerSession,
      measurementsPerParticipant,
      totalMeasurements: measurementsPerParticipant * totalParticipants,
    },
  };
}

// Export to JSON format for download
export function exportToJSON(data: ExperimentData): string {
  return JSON.stringify(data, null, 2);
}

// Convert to flat structure for Excel export
export interface FlatMeasurement {
  participantId: number;
  randomSeed: number;
  session: number;
  modality: string;
  modalityOrder: number;
  modelType: string;
  modelTypeOrder: number;
  repetition: number;
  modelPosition: number;
  modelId: string;
  modelName: string;
  measurementNumber: number;
}

export function flattenForExcel(data: ExperimentData): FlatMeasurement[] {
  const rows: FlatMeasurement[] = [];
  let measurementNumber = 0;

  for (const participant of data.participants) {
    for (const session of participant.sessions) {
      for (const modalityBlock of session.modalities) {
        // Get blocks in correct order based on modelTypeOrder
        const orderedBlocks = session.modelTypeOrder[0] === 'ball'
          ? [modalityBlock.ballBlock, modalityBlock.balloonBlock]
          : [modalityBlock.balloonBlock, modalityBlock.ballBlock];

        for (const modelBlock of orderedBlocks) {
          for (const measurement of modelBlock.measurements) {
            measurementNumber++;
            rows.push({
              participantId: participant.recordId,
              randomSeed: participant.randomSeed,
              session: session.sessionNumber,
              modality: modalityBlock.modality,
              modalityOrder: modalityBlock.order,
              modelType: modelBlock.modelType,
              modelTypeOrder: modelBlock.order,
              repetition: measurement.repetition,
              modelPosition: measurement.modelOrder,
              modelId: measurement.modelId,
              modelName: measurement.modelName,
              measurementNumber,
            });
          }
        }
      }
    }
  }

  return rows;
}

// Local storage key
const STORAGE_KEY = 'compressibility-study-data';

// Save to local storage
export function saveToLocalStorage(data: ExperimentData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

// Load from local storage
export function loadFromLocalStorage(): ExperimentData | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as ExperimentData;
      } catch {
        return null;
      }
    }
  }
  return null;
}

// Clear local storage
export function clearLocalStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Firestore functions
import { db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

const FIRESTORE_COLLECTION = 'experiments';
const FIRESTORE_DOC_ID = 'main';

// Save to Firestore
export async function saveToFirestore(data: ExperimentData): Promise<void> {
  console.log('[DEBUG] saveToFirestore: Starting...');

  // Add timeout to prevent hanging
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Firestore save timeout after 10s')), 10000);
  });

  try {
    console.log('[DEBUG] saveToFirestore: Creating doc reference...');
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);

    console.log('[DEBUG] saveToFirestore: Calling setDoc...');
    await Promise.race([
      setDoc(docRef, data),
      timeoutPromise
    ]);

    console.log('[DEBUG] saveToFirestore: Data saved successfully');
    // Also save to localStorage as backup
    saveToLocalStorage(data);
  } catch (error) {
    console.error('[DEBUG] saveToFirestore: Error:', error);
    // Fallback to localStorage only
    saveToLocalStorage(data);
    throw error;
  }
}

// Load from Firestore with timeout
export async function loadFromFirestore(): Promise<ExperimentData | null> {
  console.log('[DEBUG] loadFromFirestore: Starting...');

  // Add timeout to prevent hanging
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Firestore timeout after 10s')), 10000);
  });

  try {
    console.log('[DEBUG] loadFromFirestore: Creating doc reference...');
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);

    console.log('[DEBUG] loadFromFirestore: Calling getDoc with timeout...');
    const docSnap = await Promise.race([
      getDoc(docRef),
      timeoutPromise
    ]);

    console.log('[DEBUG] loadFromFirestore: getDoc completed, exists:', docSnap?.exists());

    if (docSnap && docSnap.exists()) {
      const data = docSnap.data() as ExperimentData;
      console.log('[DEBUG] loadFromFirestore: Data loaded successfully');
      // Update localStorage with latest from Firestore
      saveToLocalStorage(data);
      return data;
    }
    console.log('[DEBUG] loadFromFirestore: No data found in Firestore');
    return null;
  } catch (error) {
    console.error('[DEBUG] loadFromFirestore: Error:', error);
    // Fallback to localStorage
    console.log('[DEBUG] loadFromFirestore: Falling back to localStorage');
    return loadFromLocalStorage();
  }
}

// Clear Firestore data
export async function clearFirestore(): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    await deleteDoc(docRef);
    clearLocalStorage();
  } catch (error) {
    console.error('Error clearing Firestore:', error);
    clearLocalStorage();
    throw error;
  }
}

// Helper to update summary after participant changes
function updateSummary(data: ExperimentData): ExperimentData {
  const measurementsPerSession = 80;
  const measurementsPerParticipant = measurementsPerSession * 3;

  return {
    ...data,
    summary: {
      totalParticipants: data.participants.length,
      measurementsPerSession,
      measurementsPerParticipant,
      totalMeasurements: measurementsPerParticipant * data.participants.length,
    },
  };
}

// Add a new participant to existing data
export function addParticipant(data: ExperimentData): ExperimentData {
  // New participant gets the next sequential number (length + 1)
  const newRecordId = data.participants.length + 1;

  // Generate a new random seed
  const randomSeed = Math.floor(Math.random() * 1000000);

  // Generate the new participant
  const newParticipant = generateParticipantRandomization(newRecordId, randomSeed);

  const updatedData: ExperimentData = {
    ...data,
    participants: [...data.participants, newParticipant],
  };

  return updateSummary(updatedData);
}

// Remove a participant and renumber all remaining participants
export function removeParticipant(data: ExperimentData, recordId: number): ExperimentData {
  // Filter out the removed participant
  const filteredParticipants = data.participants.filter(p => p.recordId !== recordId);

  // Renumber all participants sequentially (1, 2, 3, ...)
  const renumberedParticipants = filteredParticipants.map((participant, index) => ({
    ...participant,
    recordId: index + 1,
  }));

  const updatedData: ExperimentData = {
    ...data,
    participants: renumberedParticipants,
  };

  return updateSummary(updatedData);
}

// Regenerate a specific participant (new randomization, same ID)
export function regenerateParticipant(data: ExperimentData, recordId: number): ExperimentData {
  // Generate a new random seed
  const newRandomSeed = Math.floor(Math.random() * 1000000);

  // Generate new randomization for this participant
  const regeneratedParticipant = generateParticipantRandomization(recordId, newRandomSeed);

  const updatedData: ExperimentData = {
    ...data,
    participants: data.participants.map(p =>
      p.recordId === recordId ? regeneratedParticipant : p
    ),
  };

  return updatedData; // Summary doesn't change for regeneration
}

// Export the internal function for use by other functions
export { generateParticipantRandomization };
