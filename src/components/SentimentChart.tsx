'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface SentimentTrendData {
  date: string;
  sentiment: number;
  mentions: number;
}

interface SentimentChartProps {
  data: SentimentTrendData[];
  showMentions?: boolean;
}

export function SentimentChart({ data, showMentions = false }: SentimentChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatSentiment = (value: number) => {
    if (value > 0) return `+${value.toFixed(2)}`;
    return value.toFixed(2);
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        {showMentions ? (
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMentions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[-1, 1]}
              tickFormatter={formatSentiment}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'sentiment') return [formatSentiment(value), 'Sentiment'];
                return [value, 'Mentions'];
              }}
              labelFormatter={formatDate}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="mentions"
              stroke="#0ea5e9"
              fillOpacity={1}
              fill="url(#colorMentions)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="sentiment"
              stroke="#031425"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              domain={[-1, 1]}
              tickFormatter={formatSentiment}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value: number) => [formatSentiment(value), 'Sentiment']}
              labelFormatter={formatDate}
            />
            <Line
              type="monotone"
              dataKey="sentiment"
              stroke="#031425"
              strokeWidth={2}
              dot={{ fill: '#031425', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#0ea5e9' }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// Pie chart for sentiment distribution
import { PieChart, Pie, Cell } from 'recharts';

interface SentimentDistributionProps {
  positive: number;
  neutral: number;
  negative: number;
}

const COLORS = ['#22c55e', '#6b7280', '#ef4444'];

export function SentimentDistribution({
  positive,
  neutral,
  negative,
}: SentimentDistributionProps) {
  const total = positive + neutral + negative;
  const data = [
    { name: 'Positive', value: positive, percent: total > 0 ? (positive / total) * 100 : 0 },
    { name: 'Neutral', value: neutral, percent: total > 0 ? (neutral / total) * 100 : 0 },
    { name: 'Negative', value: negative, percent: total > 0 ? (negative / total) * 100 : 0 },
  ];

  return (
    <div className="flex items-center gap-8">
      <div className="w-[150px] h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index] }}
            />
            <span className="text-sm text-muted w-16">{item.name}</span>
            <span className="font-semibold">{item.value}</span>
            <span className="text-sm text-muted">({item.percent.toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
