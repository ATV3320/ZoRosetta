'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { name: '1D', value: 3000 },
  { name: '7D', value: 3500 },
  { name: '1M', value: 4200 },
  { name: '3M', value: 4800 },
  { name: '1Y', value: 5500 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background-light p-3 rounded-lg border border-gray-700">
        <p className="text-sm">{`${label}: $${payload[0].value}`}</p>
      </div>
    )
  }
  return null
}

export default function TrendAnalysis() {
  return (
    <div className="bg-background-light rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">Trend Analysis</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="name"
              stroke="#9CA3AF"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9CA3AF"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#1D4ED8"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 