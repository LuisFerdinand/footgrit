import {
  Activity,
  Award,
  BarChart3,
  BrickWall,
  CalendarDays,
  ChartNoAxesColumn,
  CheckCircle2,
  ClipboardList,
  Database,
  FileInput,
  Flame,
  Hand,
  Heart,
  LayoutDashboard,
  Radar,
  Radio,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Wand2,
  type LucideProps,
} from "lucide-react";

const MAP = {
  LayoutDashboard,
  Database,
  FileInput,
  Trophy,
  Radio,
  Radar,
  Sparkles,
  Settings,
  Users,
  Activity,
  BarChart3,
  ChartNoAxesColumn,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  // badge icons
  target: Target,
  wand: Wand2,
  hand: Hand,
  star: Star,
  flame: Flame,
  shield: ShieldCheck,
  heart: Heart,
  sparkles: Sparkles,
  "trending-up": TrendingUp,
  "brick-wall": BrickWall,
  award: Award,
} as const;

export function Icon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Cmp = (MAP as Record<string, React.ComponentType<LucideProps>>)[name] ?? Award;
  return <Cmp {...props} />;
}
