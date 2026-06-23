import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const data1 = [
  { name: 'Global Equities', value: 85 },
  { name: 'Other', value: 15 },
]
const data2 = [
  { name: 'Fixed Income', value: 25 },
  { name: 'Other', value: 75 },
]
const data3 = [
  { name: 'Alternative', value: 10 },
  { name: 'Other', value: 90 },
]

const COLORS = ['#3b82f6', '#34d399']
const BG_COLOR = 'rgba(255, 255, 255, 0.05)'

interface DonutSlice {
  name: string
  value: number
}

function Donut({ data, label, subLabel }: { data: DonutSlice[]; label: string; subLabel: string }) {
  return (
    <div className="flex flex-col items-center">
      <div style={{ width: 140, height: 140, minWidth: 0 }}>
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={45}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              <Cell fill={COLORS[0] ?? '#3b82f6'} />
              <Cell fill={BG_COLOR} />
            </Pie>
            <Pie
              data={data}
              innerRadius={25}
              outerRadius={40}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              <Cell fill={COLORS[1] ?? '#34d399'} />
              <Cell fill={BG_COLOR} />
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#fff',
              }}
              itemStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-4">
        <div className="text-[0.875rem] text-[#f1f5f9] font-medium">{label}</div>
        <div className="text-[0.75rem] text-[#34d399] mt-1">{subLabel}</div>
      </div>
    </div>
  )
}

export function PortfolioAllocation() {
  return (
    <div className="flex justify-around items-center py-4">
      <Donut data={data1} label="Global Equities" subLabel="(85%)" />
      <Donut data={data2} label="Fixed Income" subLabel="(25%)" />
      <Donut data={data3} label="Alternative Investments" subLabel="(10%)" />
    </div>
  )
}
