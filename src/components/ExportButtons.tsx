'use client';

import { ExperimentData, exportToJSON, flattenForExcel } from '@/lib/randomization';

interface ExportButtonsProps {
  data: ExperimentData | null;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export default function ExportButtons({ data, onRefresh, isRefreshing }: ExportButtonsProps) {
  if (!data) return null;

  const handleExportJSON = () => {
    const json = exportToJSON(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const flatData = flattenForExcel(data);

    const headers = [
      'Participant ID',
      'Random Seed',
      'Session',
      'Modality',
      'Modality Order',
      'Model Type',
      'Model Type Order',
      'Repetition',
      'Model Position',
      'Model ID',
      'Model Name',
      'Measurement Number',
    ];

    const rows = flatData.map(row => [
      row.participantId,
      row.randomSeed,
      row.session,
      row.modality,
      row.modalityOrder,
      row.modelType,
      row.modelTypeOrder,
      row.repetition,
      row.modelPosition,
      row.modelId,
      row.modelName,
      row.measurementNumber,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportSummary = () => {
    const summaryLines = [
      '# Experiment Randomization Summary',
      '',
      `Generated: ${new Date(data.generatedAt).toLocaleString()}`,
      '',
      '## Participant Counts',
      `- Total: ${data.summary.totalParticipants}`,
      '',
      '## Measurement Counts',
      `- Per Session: ${data.summary.measurementsPerSession}`,
      `- Per Participant: ${data.summary.measurementsPerParticipant}`,
      `- Total: ${data.summary.totalMeasurements}`,
      '',
      '## Participant Randomization Details',
      '',
    ];

    for (const participant of data.participants) {
      const session = participant.sessions[0];
      summaryLines.push(`### Participant #${participant.recordId}`);
      summaryLines.push(`- Random Seed: ${participant.randomSeed}`);
      summaryLines.push(`- Modality Order: ${session.modalityOrder.join(' → ')}`);
      summaryLines.push(`- Model Type Order: ${session.modelTypeOrder.join(' → ')}`);
      summaryLines.push(`- Ball Sphere Order: ${session.ballSphereOrder.join(' → ')}`);
      summaryLines.push(`- Balloon Point Order: ${session.balloonPointOrder.join(' → ')}`);
      summaryLines.push('');
    }

    const blob = new Blob([summaryLines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment_summary_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
      >
        <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </button>

      <button
        onClick={handleExportJSON}
        className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-medium text-sm transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        JSON
      </button>

      <button
        onClick={handleExportCSV}
        className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 text-accent-foreground rounded-lg font-medium text-sm transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        CSV
      </button>

      <button
        onClick={handleExportSummary}
        className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-medium text-sm transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Summary
      </button>
    </div>
  );
}
