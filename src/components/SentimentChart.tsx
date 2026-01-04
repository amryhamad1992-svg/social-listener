'use client';

import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis,
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

// Clean Stackline-style bar chart for mentions
export function SentimentChart({ data }: SentimentChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get bar color based on sentiment
  const getBarColor = (sentiment: number) => {
    if (sentiment > 0.3) return '#10B981'; // Green for positive
    if (sentiment < -0.1) return '#EF4444'; // Red for negative
    return '#1E293B'; // Navy for neutral
  };

  return (
    <div className="w-full" style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Simple bar chart - Stackline style */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px',
                fontFamily: 'Roboto, sans-serif',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value, name) => {
                if (name === 'mentions' && typeof value === 'number') return [value.toLocaleString(), 'Mentions'];
                return [value, name];
              }}
              labelFormatter={formatDate}
            />
            <Bar dataKey="mentions" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.sentiment)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#10B981]" />
          <span className="text-[11px] text-[#64748B]">Positive sentiment</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#1E293B]" />
          <span className="text-[11px] text-[#64748B]">Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#EF4444]" />
          <span className="text-[11px] text-[#64748B]">Negative sentiment</span>
        </div>
      </div>
    </div>
  );
}

// Bubble Chart for Topic Analysis
interface BubbleData {
  name: string;
  sentiment: number;
  mentions: number;
  engagement: number;
}

interface TopicBubbleChartProps {
  data: BubbleData[];
}

export function TopicBubbleChart({ data }: TopicBubbleChartProps) {
  const formatSentiment = (value: number) => {
    if (value > 0) return `+${value.toFixed(2)}`;
    return value.toFixed(2);
  };

  const getBubbleColor = (sentiment: number) => {
    if (sentiment > 0.2) return '#22c55e';
    if (sentiment < -0.2) return '#ef4444';
    return '#6b7280';
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
          <span className="text-xs text-[#64748B]">Positive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#6b7280]" />
          <span className="text-xs text-[#64748B]">Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
          <span className="text-xs text-[#64748B]">Negative</span>
        </div>
      </div>
    </div>
  );
}

// Sentiment Distribution Pie Chart
interface SentimentDistributionProps {
  positive: number;
  neutral: number;
  negative: number;
}

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
    <div className="flex flex-col items-center" style={{ fontFamily: 'Roboto, sans-serif' }}>
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
