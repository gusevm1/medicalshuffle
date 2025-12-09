'use client';

import { useState } from 'react';

interface ExperimentFormProps {
  onGenerate: (participants: number) => void;
  isLoading: boolean;
  hasExistingData: boolean;
}

export default function ExperimentForm({ onGenerate, isLoading, hasExistingData }: ExperimentFormProps) {
  const [inputValue, setInputValue] = useState('25');

  // Parse and validate the input
  const parsedValue = parseInt(inputValue, 10);
  const isValidNumber = !isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= 50;
  const participants = isValidNumber ? parsedValue : 0;
  const totalMeasurements = participants * 240;

  // Determine validation message
  const getValidationMessage = () => {
    if (inputValue === '') return 'Please enter a number between 1 and 50';
    if (isNaN(parsedValue)) return 'Please enter a valid number';
    if (parsedValue < 1) return 'Minimum 1 participant required';
    if (parsedValue > 50) return 'Maximum 50 participants allowed';
    return null;
  };

  const validationMessage = getValidationMessage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidNumber) {
      onGenerate(parsedValue);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-lg shadow-sm border border-border p-6">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">
        Participant Configuration
      </h2>

      <div className="mb-6">
        <label htmlFor="participants" className="block text-sm font-medium text-card-foreground mb-2">
          Number of Participants
        </label>
        <div className="relative max-w-xs">
          <input
            type="number"
            id="participants"
            min="1"
            max="50"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={`w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              validationMessage ? 'border-destructive' : 'border-input'
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full">
              <svg className="w-3.5 h-3.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </span>
          </div>
        </div>
        {validationMessage && (
          <p className="mt-2 text-sm text-destructive">{validationMessage}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total Participants:</span>
            <span className="font-semibold text-card-foreground">{isValidNumber ? participants : '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total Measurements:</span>
            <span className="font-semibold text-card-foreground">{isValidNumber ? totalMeasurements.toLocaleString() : '—'}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!isValidNumber || isLoading}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            !isValidNumber || isLoading
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md cursor-pointer'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </span>
          ) : hasExistingData ? (
            'Regenerate'
          ) : (
            'Generate Randomization'
          )}
        </button>
      </div>

      {hasExistingData && (
        <p className="mt-3 text-xs text-muted-foreground">
          Existing data found. Click &quot;Regenerate&quot; to create new randomizations.
        </p>
      )}
    </form>
  );
}
