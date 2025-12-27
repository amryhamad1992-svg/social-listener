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
              formatter={(value, name) => {
                if (name === 'sentiment') return [formatSentiment(value as number), 'Sentiment'];
                return [value as number, 'Mentions'];
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
              formatter={(value) => [formatSentiment(value as number), 'Sentiment']}
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
import { PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';

// Bubble Chart for Topic Analysis
interface BubbleData {
  name: string;
  sentiment: number; // x-axis: -1 to 1
  mentions: number; // y-axis: count
  engagement: number; // bubble size
}

interface TopicBubbleChartProps {
  data: BubbleData[];
}

export function TopicBubbleChart({ data }: TopicBubbleChartProps) {
  const formatSentiment = (value: number) => {
    if (value > 0) return `+${value.toFixed(2)}`;
    return value.toFixed(2);
  };

  // Color based on sentiment
  const getBubbleColor = (sentiment: number) => {
    if (sentiment > 0.2) return '#22c55e'; // green
    if (sentiment < -0.2) return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            dataKey="sentiment"
            domain={[-1, 1]}
            name="Sentiment"
            tickFormatter={formatSentiment}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            label={{ value: 'Sentiment', position: 'bottom', offset: 0, fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="mentions"
            name="Mentions"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            label={{ value: 'Mentions', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
          />
          <ZAxis
            type="number"
            dataKey="engagement"
            range={[100, 1000]}
            name="Engagement"
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value, name) => {
              if (name === 'Sentiment') return [formatSentiment(value as number), name];
              return [value, name];
            }}
            labelFormatter={(_, payload) => {
              if (payload && payload[0]) {
                return payload[0].payload.name;
              }
              return '';
            }}
          />
          <Scatter
            data={data}
            shape={(props: unknown) => {
              const { cx, cy, payload } = props as { cx: number; cy: number; payload: BubbleData };
              const size = Math.sqrt(payload.engagement) * 2;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={Math.max(8, Math.min(size, 40))}
                  fill={getBubbleColor(payload.sentiment)}
                  fillOpacity={0.7}
                  stroke={getBubbleColor(payload.sentiment)}
                  strokeWidth={2}
                />
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
          <span className="text-xs text-muted">Positive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#6b7280]" />
          <span className="text-xs text-muted">Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
          <span className="text-xs text-muted">Negative</span>
        </div>
      </div>
    </div>
  );
}

interface SentimentDistributionProps {
  positive: number;
  neutral: number;
  negative: number;
}

// Pastel Stackline colors
const COLORS = ['#86EFAC', '#CBD5E1', '#FCA5A5'];

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
    <div className="flex flex-col items-center">
      {/* Pie Chart */}
      <div className="w-[200px] h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center total */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-semibold text-[#1E293B]">{total}</div>
            <div className="text-[10px] text-[#64748B] uppercase">Total</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        {data.map((item, index) => (
          <div key={item.name} className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index] }}
              />
              <span className="text-[12px] text-[#64748B]">{item.name}</span>
            </div>
            <div className="text-[15px] font-semibold text-[#1E293B]">
              {item.percent.toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
