import { cn } from '@/lib/utils';
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartDataPoint {
  date: string;
  value: number;
  previousValue?: number;
}

interface EngagementChartProps {
  data: ChartDataPoint[];
  title?: string;
  showComparison?: boolean;
  loading?: boolean;
  className?: string;
}

export function EngagementChart({
  data,
  title = 'Engagement Trend',
  showComparison = false,
  loading = false,
  className,
}: EngagementChartProps) {
  if (loading) {
    return (
      <div className={cn('chart-container', className)}>
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className={cn('chart-container', className)}>
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              {showComparison && (
                <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
              itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            {showComparison && (
              <Area
                type="monotone"
                dataKey="previousValue"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="url(#previousGradient)"
                name="Previous Period"
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#engagementGradient)"
              name="Current Period"
              dot={false}
              activeDot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Post Types Performance Bar Chart
interface PostTypeData {
  type: string;
  engagement: number;
  posts: number;
}

interface PostTypeChartProps {
  data: PostTypeData[];
  title?: string;
  loading?: boolean;
  className?: string;
}

export function PostTypeChart({
  data,
  title = 'Post Type Performance',
  loading = false,
  className,
}: PostTypeChartProps) {
  if (loading) {
    return (
      <div className={cn('chart-container', className)}>
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className={cn('chart-container', className)}>
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
            <XAxis 
              type="number" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              type="category" 
              dataKey="type" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)',
              }}
              cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
            />
            <Bar 
              dataKey="engagement" 
              fill="hsl(var(--primary))" 
              radius={[0, 4, 4, 0]}
              name="Avg. Engagement"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Best Time Heatmap (compact)
interface HeatmapData {
  day: string;
  hour: number;
  value: number;
}

interface BestTimeHeatmapProps {
  data: HeatmapData[];
  title?: string;
  loading?: boolean;
  className?: string;
}

export function BestTimeHeatmap({
  data,
  title = 'Best Time to Post',
  loading = false,
  className,
}: BestTimeHeatmapProps) {
  if (loading) {
    return (
      <div className={cn('chart-container', className)}>
        <Skeleton className="h-5 w-36 mb-4" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayToIndex: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hours = [9, 12, 15, 18, 21]; // Key hours only

  const getHeatValue = (day: string, hour: number) => {
    const idx = dayToIndex[day];
    // Match by numeric day index (backend stores day as number) or string name
    const point = data.find(d => (d.day === idx || d.day === day) && d.hour === hour);
    return point?.value || 0;
  };

  const getColor = (value: number) => {
    if (value >= 80) return 'bg-success';
    if (value >= 60) return 'bg-success/60';
    if (value >= 40) return 'bg-accent/50';
    if (value >= 20) return 'bg-muted';
    return 'bg-muted/50';
  };

  return (
    <div className={cn('chart-container', className)}>
      {title && <h4 className="chart-title">{title}</h4>}
      
      <div className="overflow-x-auto">
        <div className="min-w-[300px]">
          {/* Hour labels */}
          <div className="flex gap-1 mb-1 pl-12">
            {hours.map(hour => (
              <div key={hour} className="flex-1 text-center text-[10px] text-muted-foreground">
                {hour}:00
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="space-y-1">
            {days.map(day => (
              <div key={day} className="flex items-center gap-1">
                <div className="w-10 text-xs text-muted-foreground">{day}</div>
                <div className="flex gap-1 flex-1">
                  {hours.map(hour => {
                    const value = getHeatValue(day, hour);
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={cn(
                          'flex-1 h-6 rounded transition-all hover:scale-110 cursor-pointer',
                          getColor(value)
                        )}
                        title={`${day} ${hour}:00 - ${value}% engagement`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-4 justify-center">
            <span className="text-xs text-muted-foreground">Low</span>
            <div className="flex gap-0.5">
              {['bg-muted/50', 'bg-muted', 'bg-accent/50', 'bg-success/60', 'bg-success'].map((color, i) => (
                <div key={i} className={cn('w-4 h-3 rounded-sm', color)} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}
