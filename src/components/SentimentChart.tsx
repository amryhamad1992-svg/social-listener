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
  Legend,
} from 'recharts';

// Stackline Official Colors
const COLORS = {
  carbonIndigo: '#031425',
  navyDark: '#2D3C4A',
  productCharts: '#adbdcc',
  slate: '#4E596A',
  moonbeam: '#E0E2E4',
  teal: '#16949b',
  tealLight: '#9ee0d0',
  success: '#71c184',
  danger: '#ff534a',
  warning: '#ffbd32',
};

interface SentimentTrendData {
  date: string;
  sentiment: number;
  mentions: number;
}

interface SentimentChartProps {
  data: SentimentTrendData[];
  showMentions?: boolean;
}

// Stackline-style grouped bar chart - Current vs Prior Period
export function SentimentChart({ data }: SentimentChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Add prior period data (simulated as ~75% of current)
  const chartData = data.map(d => ({
    ...d,
    priorMentions: Math.round(d.mentions * 0.75),
  }));

  return (
    <div className="w-full" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Legend - Stackline style at top */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-[3px] rounded" style={{ backgroundColor: COLORS.productCharts }} />
          <span className="text-[11px]" style={{ color: COLORS.slate }}>Prior Year</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-[3px] rounded" style={{ backgroundColor: COLORS.carbonIndigo }} />
          <span className="text-[11px]" style={{ color: COLORS.slate }}>Current Period</span>
        </div>
      </div>

      {/* Grouped bar chart - Stackline style */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={2}>
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: COLORS.slate }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: COLORS.slate }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{
                backgroundColor: '#fff',
                border: `1px solid ${COLORS.moonbeam}`,
                borderRadius: '8px',
                padding: '12px',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              }}
              formatter={(value, name) => {
                if (typeof value === 'number') {
                  const label = name === 'priorMentions' ? 'Prior Year' : 'Current Period';
                  return [value.toLocaleString(), label];
                }
                return [value, name];
              }}
              labelFormatter={formatDate}
            />
            {/* Prior Year - Light Gray */}
            <Bar dataKey="priorMentions" fill={COLORS.productCharts} radius={[2, 2, 0, 0]} maxBarSize={24} />
            {/* Current Period - Dark Navy */}
            <Bar dataKey="mentions" fill={COLORS.carbonIndigo} radius={[2, 2, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
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
    if (sentiment > 0.2) return COLORS.success;
    if (sentiment < -0.2) return COLORS.danger;
    return COLORS.slate;
  };

  return (
    <div className="w-full h-[350px]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.moonbeam} />
          <XAxis
            type="number"
            dataKey="sentiment"
            domain={[-1, 1]}
            name="Sentiment"
            tickFormatter={formatSentiment}
            tick={{ fontSize: 12, fill: COLORS.slate }}
            axisLine={{ stroke: COLORS.moonbeam }}
            label={{ value: 'Sentiment', position: 'bottom', offset: 0, fill: COLORS.slate, fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="mentions"
            name="Mentions"
            tick={{ fontSize: 12, fill: COLORS.slate }}
            axisLine={{ stroke: COLORS.moonbeam }}
            label={{ value: 'Mentions', angle: -90, position: 'insideLeft', fill: COLORS.slate, fontSize: 12 }}
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
              border: `1px solid ${COLORS.moonbeam}`,
              borderRadius: '8px',
              padding: '12px',
              fontFamily: 'Inter, sans-serif',
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
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.success }} />
          <span className="text-xs" style={{ color: COLORS.slate }}>Positive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.slate }} />
          <span className="text-xs" style={{ color: COLORS.slate }}>Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.danger }} />
          <span className="text-xs" style={{ color: COLORS.slate }}>Negative</span>
        </div>
      </div>
    </div>
  );
}

// Sentiment Distribution Pie Chart - Stackline Style
interface SentimentDistributionProps {
  positive: number;
  neutral: number;
  negative: number;
}

// Stackline color palette for sentiment
const SENTIMENT_COLORS = [COLORS.carbonIndigo, COLORS.teal, COLORS.warning];

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
    <div className="flex flex-col items-center" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Pie Chart - Stackline style */}
      <div className="w-[180px] h-[180px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center total */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[22px] font-semibold" style={{ color: COLORS.carbonIndigo }}>{total}</div>
            <div className="text-[9px] uppercase tracking-wide" style={{ color: COLORS.slate }}>Total</div>
          </div>
        </div>
      </div>

      {/* Legend - Stackline horizontal style */}
      <div className="flex justify-center gap-5 mt-4">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: SENTIMENT_COLORS[index] }}
            />
            <div>
              <span className="text-[11px]" style={{ color: COLORS.slate }}>{item.name}</span>
              <span className="text-[11px] font-semibold ml-1" style={{ color: COLORS.carbonIndigo }}>
                {item.percent.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
