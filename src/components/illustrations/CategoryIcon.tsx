import { Gauge, PlugZap, Thermometer, Wrench, Building2, Flame, Utensils, Zap, FlaskConical, Droplets, type LucideIcon } from 'lucide-react'

const map: Record<string, LucideIcon> = {
  gauge: Gauge, thermo: Thermometer, valve: Wrench, plug: PlugZap,
  building: Building2, flame: Flame, utensils: Utensils, zap: Zap, flask: FlaskConical, droplets: Droplets,
}

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const I = map[name] ?? Gauge
  return <I className={className} aria-hidden strokeWidth={1.5} />
}
