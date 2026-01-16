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
  color: string;
  order: number;
}

export interface BalloonModel {
  id: string;
  name: string;
  order: number;
}

export interface ModelTypeBlock {
  modelType: 'ball' | 'balloon';
  order: number;
  models: BallModel[] | BalloonModel[];
  measurements: Measurement[];
}

export interface Measurement {
  repetition: number; // 1-5
  modelOrder: number; // 1-4
  modelId: string;
  modelName: string;
  color?: string; // For ball models (sphere colors)
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
  balloonOrder: string[];
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

// Ball sphere definitions with color names
const BALL_SPHERES = [
  { id: 'S1', name: 'Yellow', color: '#EAB308' },
  { id: 'S2', name: 'Green', color: '#22C55E' },
  { id: 'S3', name: 'Red', color: '#EF4444' },
  { id: 'S4', name: 'Blue', color: '#3B82F6' },
];

// Balloon model definitions
const BALLOON_MODELS = [
  { id: 'B1', name: 'Balloon 1' },
  { id: 'B2', name: 'Balloon 2' },
  { id: 'B3', name: 'Balloon 3' },
  { id: 'B4', name: 'Balloon 4' },
];

// Generate measurements for a model type using cycle structure
function generateCycleMeasurements(
  modelIds: string[],
  modelNames: string[],
  colors?: string[],
  repetitions: number = 5
): Measurement[] {
  const measurements: Measurement[] = [];

  for (let rep = 1; rep <= repetitions; rep++) {
    for (let order = 0; order < modelIds.length; order++) {
      const measurement: Measurement = {
        repetition: rep,
        modelOrder: order + 1,
        modelId: modelIds[order],
        modelName: modelNames[order],
      };
      // Only add color if it exists (Firebase doesn't accept undefined)
      if (colors?.[order]) {
        measurement.color = colors[order];
      }
      measurements.push(measurement);
    }
  }

  return measurements;
}

// Generate measurements with independently randomized order for each repetition (for Palpation)
function generateRandomizedCycleMeasurements(
  modelIds: string[],
  modelNames: string[],
  random: () => number,
  colors?: string[],
  repetitions: number = 5
): Measurement[] {
  const measurements: Measurement[] = [];

  for (let rep = 1; rep <= repetitions; rep++) {
    // Create indices and shuffle them for this repetition
    const indices = Array.from({ length: modelIds.length }, (_, i) => i);
    const shuffledIndices = shuffleArray(indices, random);

    for (let order = 0; order < shuffledIndices.length; order++) {
      const idx = shuffledIndices[order];
      const measurement: Measurement = {
        repetition: rep,
        modelOrder: order + 1,
        modelId: modelIds[idx],
        modelName: modelNames[idx],
      };
      // Only add color if it exists (Firebase doesn't accept undefined)
      if (colors?.[idx]) {
        measurement.color = colors[idx];
      }
      measurements.push(measurement);
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
  balloonOrder: string[],
  random: () => number
): Session {
  const modalities: ModalityBlock[] = [];

  for (let i = 0; i < modalityOrder.length; i++) {
    const modality = modalityOrder[i];
    const isPalpation = modality === 'palpation';

    // Create ball models block
    const ballModels: BallModel[] = ballSphereOrder.map((sphereId, idx) => {
      const sphere = BALL_SPHERES.find(s => s.id === sphereId)!;
      return {
        id: sphereId,
        name: sphere.name,
        color: sphere.color,
        order: idx + 1,
      };
    });

    // Create balloon models block
    const balloonModels: BalloonModel[] = balloonOrder.map((balloonId, idx) => {
      const balloon = BALLOON_MODELS.find(b => b.id === balloonId)!;
      return {
        id: balloonId,
        name: balloon.name,
        order: idx + 1,
      };
    });

    // For Palpation: independently randomize order for each repetition
    // For Ultrasound: use fixed order across all repetitions
    const ballMeasurements = isPalpation
      ? generateRandomizedCycleMeasurements(
          ballSphereOrder,
          ballModels.map(m => m.name),
          random,
          ballModels.map(m => m.color)
        )
      : generateCycleMeasurements(
          ballSphereOrder,
          ballModels.map(m => m.name),
          ballModels.map(m => m.color)
        );

    const balloonMeasurements = isPalpation
      ? generateRandomizedCycleMeasurements(
          balloonOrder,
          balloonModels.map(m => m.name),
          random
        )
      : generateCycleMeasurements(
          balloonOrder,
          balloonModels.map(m => m.name)
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
      models: balloonModels,
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
    balloonOrder,
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

  // Layer 4: Randomize balloon order (independent from ball)
  const balloonIds = BALLOON_MODELS.map(b => b.id);
  const balloonOrder = shuffleArray(balloonIds, random);

  // Generate identical sessions (randomized ONCE, copied to all 3)
  const baseSession = generateSession(1, modalityOrder, modelTypeOrder, ballSphereOrder, balloonOrder, random);

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
        const rawData = JSON.parse(stored);
        // Migrate old data format to new format
        return migrateData(rawData);
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

// Migrate old data format to new format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateData(data: any): ExperimentData {
  if (!data || !data.participants) return data;

  // Map old sphere names to new color names
  const sphereToColor: { [key: string]: { name: string; color: string } } = {
    'Sphere 1': { name: 'Yellow', color: '#EAB308' },
    'Sphere 2': { name: 'Green', color: '#22C55E' },
    'Sphere 3': { name: 'Red', color: '#EF4444' },
    'Sphere 4': { name: 'Blue', color: '#3B82F6' },
  };

  for (const participant of data.participants) {
    for (const session of participant.sessions) {
      // Migrate balloonPointOrder -> balloonOrder
      if (session.balloonPointOrder && !session.balloonOrder) {
        // Convert old P1, P2, P3, P4 IDs to new B1, B2, B3, B4 IDs
        session.balloonOrder = session.balloonPointOrder.map((id: string) => {
          if (id.startsWith('P')) {
            return 'B' + id.substring(1);
          }
          return id;
        });
        delete session.balloonPointOrder;
      }

      // Migrate models in modalities
      for (const modality of session.modalities) {
        // Migrate ball models (Sphere names -> Color names)
        const ballBlock = modality.ballBlock;
        if (ballBlock) {
          // Migrate ball models
          ballBlock.models = ballBlock.models.map((m: { id: string; name: string; color?: string; order: number }) => {
            const colorInfo = sphereToColor[m.name];
            if (colorInfo) {
              return {
                id: m.id,
                name: colorInfo.name,
                color: colorInfo.color,
                order: m.order
              };
            }
            // Already migrated or new format
            if (!m.color) {
              // Add color based on ID
              const sphereNum = m.id.substring(1);
              const defaultColors: { [key: string]: string } = {
                '1': '#EAB308', '2': '#22C55E', '3': '#EF4444', '4': '#3B82F6'
              };
              return { ...m, color: defaultColors[sphereNum] || '#888888' };
            }
            return m;
          });

          // Migrate ball measurements
          ballBlock.measurements = ballBlock.measurements.map((m: { modelId: string; modelName: string; color?: string; repetition: number; modelOrder: number }) => {
            const colorInfo = sphereToColor[m.modelName];
            if (colorInfo) {
              return { ...m, modelName: colorInfo.name, color: colorInfo.color };
            }
            return m;
          });
        }

        // Migrate balloon models
        const balloonBlock = modality.balloonBlock;
        if (balloonBlock) {
          // Migrate models from pressure-based to name-based
          balloonBlock.models = balloonBlock.models.map((m: { id: string; pressure?: number; name?: string; order: number }) => {
            // Convert old P IDs to new B IDs
            let newId = m.id;
            if (m.id.startsWith('P')) {
              newId = 'B' + m.id.substring(1);
            }
            // If it has pressure (old format), convert to name
            if ('pressure' in m && !('name' in m)) {
              const balloonNum = newId.substring(1);
              return {
                id: newId,
                name: `Balloon ${balloonNum}`,
                order: m.order
              };
            }
            return { ...m, id: newId };
          });

          // Migrate measurements
          balloonBlock.measurements = balloonBlock.measurements.map((m: { modelId: string; modelName: string; repetition: number; modelOrder: number }) => {
            let newId = m.modelId;
            if (m.modelId.startsWith('P')) {
              newId = 'B' + m.modelId.substring(1);
            }
            // If modelName contains mmHg, convert to Balloon name
            let newName = m.modelName;
            if (m.modelName.includes('mmHg')) {
              const balloonNum = newId.substring(1);
              newName = `Balloon ${balloonNum}`;
            }
            return { ...m, modelId: newId, modelName: newName };
          });
        }
      }
    }
  }

  return data as ExperimentData;
}

// Firestore functions
import { db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

const FIRESTORE_COLLECTION = 'experiments';
const FIRESTORE_DOC_ID = 'main';

// Save to Firestore
export async function saveToFirestore(data: ExperimentData): Promise<void> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Firestore save timeout after 10s')), 10000);
  });

  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    await Promise.race([
      setDoc(docRef, data),
      timeoutPromise
    ]);
    // Also save to localStorage as backup
    saveToLocalStorage(data);
  } catch (error) {
    // Fallback to localStorage only
    saveToLocalStorage(data);
    throw error;
  }
}

// Load from Firestore with timeout
export async function loadFromFirestore(): Promise<ExperimentData | null> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Firestore timeout after 10s')), 10000);
  });

  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    const docSnap = await Promise.race([
      getDoc(docRef),
      timeoutPromise
    ]);

    if (docSnap && docSnap.exists()) {
      const rawData = docSnap.data();
      // Migrate old data format to new format
      const data = migrateData(rawData);
      // Update localStorage with migrated data
      saveToLocalStorage(data);
      return data;
    }
    return null;
  } catch {
    // Fallback to localStorage
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
