'use client';

import { ExperimentData } from '@/lib/randomization';

interface SummaryStatsProps {
  data: ExperimentData;
}

const MINUTES_PER_SESSION = 30;
const SESSIONS_PER_PARTICIPANT = 3;

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export default function SummaryStats({ data }: SummaryStatsProps) {
  const { summary } = data;

  const totalLabTime = summary.totalParticipants * SESSIONS_PER_PARTICIPANT * MINUTES_PER_SESSION;

  const stats = [
    {
      label: 'Total Participants',
      value: summary.totalParticipants,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      ),
      color: 'bg-chart-1/10 text-chart-1',
    },
    {
      label: 'Per Session',
      value: summary.measurementsPerSession,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
      color: 'bg-chart-2/10 text-chart-2',
    },
    {
      label: 'Per Participant',
      value: summary.measurementsPerParticipant,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      ),
      color: 'bg-chart-3/10 text-chart-3',
    },
    {
      label: 'Total Measurements',
      value: summary.totalMeasurements.toLocaleString(),
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      color: 'bg-chart-4/10 text-chart-4',
    },
    {
      label: 'Total Lab Time',
      value: formatTime(totalLabTime),
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 7.5a.5.5 0 01.5-.5h3a.5.5 0 010 1H9v2.5a.5.5 0 01-1 0V7.5z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
        </svg>
      ),
      color: 'bg-chart-1/10 text-chart-1',
    },
  ];

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-card-foreground">
          Experiment Summary
        </h2>
        <span className="text-xs text-muted-foreground">
          Generated: {new Date(data.generatedAt).toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center p-4 rounded-lg bg-muted/30"
          >
            <div className={`p-2 rounded-full ${stat.color} mb-2`}>
              {stat.icon}
            </div>
            <span className="text-2xl font-bold text-card-foreground">
              {stat.value}
            </span>
            <span className="text-xs text-muted-foreground text-center">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
