'use client';

import { useState } from 'react';
import { Participant, Session, ModalityBlock, ModelTypeBlock } from '@/lib/randomization';

interface ParticipantCardProps {
  participant: Participant;
  onRemove: (recordId: number) => void;
  onRegenerate: (recordId: number) => void;
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ModalityBadge({ modality }: { modality: string }) {
  const isUltrasound = modality === 'ultrasound';
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
      isUltrasound
        ? 'bg-chart-1/20 text-chart-1'
        : 'bg-chart-3/20 text-chart-3'
    }`}>
      {isUltrasound ? 'Ultrasound' : 'Palpation'}
    </span>
  );
}

function ModelTypeBadge({ modelType }: { modelType: string }) {
  const isBall = modelType === 'ball';
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
      isBall
        ? 'bg-chart-2/20 text-chart-2'
        : 'bg-chart-4/20 text-chart-4'
    }`}>
      {isBall ? 'Ball Models' : 'Balloon Model'}
    </span>
  );
}

function MeasurementTable({ block }: { block: ModelTypeBlock }) {
  // Group measurements by repetition to show the actual order per rep
  const measurementsByRep: { [rep: number]: { modelId: string; modelName: string; color?: string }[] } = {};
  for (const m of block.measurements) {
    if (!measurementsByRep[m.repetition]) {
      measurementsByRep[m.repetition] = [];
    }
    measurementsByRep[m.repetition].push({ modelId: m.modelId, modelName: m.modelName, color: m.color });
  }

  const numModels = block.models.length;
  const isBallModel = block.modelType === 'ball';

  return (
    <div className="mt-2">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="py-1.5 px-2 text-left font-medium text-muted-foreground">Rep</th>
            {Array.from({ length: numModels }, (_, idx) => (
              <th key={idx} className="py-1.5 px-2 text-center font-medium text-muted-foreground">
                #{idx + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map(rep => {
            const repMeasurements = measurementsByRep[rep] || [];
            return (
              <tr key={rep} className="border-b border-border/50">
                <td className="py-1.5 px-2 font-medium text-card-foreground">{rep}</td>
                {repMeasurements.map((m, idx) => (
                  <td key={idx} className="py-1.5 px-2 text-center">
                    <span
                      style={m.color ? { color: m.color, fontWeight: 600 } : undefined}
                      className={!m.color ? 'text-muted-foreground' : ''}
                    >
                      {m.modelName}
                    </span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-1 text-xs text-muted-foreground">
        Models: {block.models.map(m => {
          if ('color' in m) {
            return m.id;
          }
          return `${m.id} (${(m as { pressure: number }).pressure} mmHg)`;
        }).join(', ')}
      </p>
    </div>
  );
}

function ModalitySection({ modalityBlock, session }: { modalityBlock: ModalityBlock; session: Session }) {
  const [isOpen, setIsOpen] = useState(false);

  const orderedBlocks = session.modelTypeOrder[0] === 'ball'
    ? [modalityBlock.ballBlock, modalityBlock.balloonBlock]
    : [modalityBlock.balloonBlock, modalityBlock.ballBlock];

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 flex items-center justify-center bg-secondary rounded-full text-xs font-medium text-secondary-foreground">
            {modalityBlock.order}
          </span>
          <ModalityBadge modality={modalityBlock.modality} />
          <span className="text-sm text-muted-foreground">
            40 measurements
          </span>
        </div>
        <ChevronIcon isOpen={isOpen} />
      </button>

      <div className={`accordion-content ${isOpen ? 'expanded' : 'collapsed'}`}>
        <div className="p-4 space-y-4 bg-card">
          {orderedBlocks.map((block, idx) => (
            <div key={block.modelType} className="border border-border/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 flex items-center justify-center bg-muted rounded text-xs font-medium text-muted-foreground">
                  {idx + 1}
                </span>
                <ModelTypeBadge modelType={block.modelType} />
                <span className="text-xs text-muted-foreground">20 measurements</span>
              </div>
              <MeasurementTable block={block} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SessionSection({ session }: { session: Session }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-secondary-foreground">
            Session {session.sessionNumber}
          </span>
          <span className="text-xs text-muted-foreground">
            {session.totalMeasurements} measurements
          </span>
        </div>
        <ChevronIcon isOpen={isOpen} />
      </button>

      <div className={`accordion-content ${isOpen ? 'expanded' : 'collapsed'}`}>
        <div className="p-4 space-y-3 bg-card">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pb-3 border-b border-border">
            <span>Modality Order: <strong className="text-card-foreground">{session.modalityOrder.map(m => m === 'ultrasound' ? 'US' : 'Palp').join(' → ')}</strong></span>
            <span className="text-border">|</span>
            <span>Model Type Order: <strong className="text-card-foreground">{session.modelTypeOrder.map(t => t === 'ball' ? 'Ball' : 'Balloon').join(' → ')}</strong></span>
          </div>

          {session.modalities.map(modalityBlock => (
            <ModalitySection
              key={`${session.sessionNumber}-${modalityBlock.modality}`}
              modalityBlock={modalityBlock}
              session={session}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ParticipantCard({ participant, onRemove, onRegenerate }: ParticipantCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmRemove(true);
  };

  const handleConfirmRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(participant.recordId);
    setShowConfirmRemove(false);
  };

  const handleCancelRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmRemove(false);
  };

  const handleRegenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRegenerate(participant.recordId);
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="flex items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full">
              <span className="text-lg font-bold text-primary">
                {participant.recordId}
              </span>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-card-foreground">
                Participant #{participant.recordId}
              </h3>
              <p className="text-xs text-muted-foreground">
                Seed: {participant.randomSeed}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              3 sessions · 240 measurements
            </span>
            <ChevronIcon isOpen={isOpen} />
          </div>
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-1 pr-4">
          {showConfirmRemove ? (
            <div className="flex items-center gap-1 bg-destructive/10 rounded-lg p-1">
              <button
                onClick={handleConfirmRemove}
                className="px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/20 rounded transition-colors cursor-pointer"
                title="Confirm remove"
              >
                Remove
              </button>
              <button
                onClick={handleCancelRemove}
                className="px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted rounded transition-colors cursor-pointer"
                title="Cancel"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleRegenerate}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                title="Regenerate randomization"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={handleRemoveClick}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                title="Remove participant"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`accordion-content ${isOpen ? 'expanded' : 'collapsed'}`}>
        <div className="px-6 pb-6 space-y-3 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm mb-4 p-3 bg-muted/50 rounded-lg">
            <div>
              <span className="text-muted-foreground">Ball Sphere Order:</span>
              <p className="font-mono text-card-foreground">
                {participant.sessions[0].ballSphereOrder.join(' → ')}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Balloon Point Order:</span>
              <p className="font-mono text-card-foreground">
                {participant.sessions[0].balloonPointOrder.join(' → ')}
              </p>
            </div>
          </div>

          <p className="text-xs text-accent-foreground bg-accent/30 px-3 py-2 rounded-lg">
            Note: All 3 sessions are identical (randomized once, then copied)
          </p>

          {participant.sessions.map(session => (
            <SessionSection key={session.sessionNumber} session={session} />
          ))}
        </div>
      </div>
    </div>
  );
}
