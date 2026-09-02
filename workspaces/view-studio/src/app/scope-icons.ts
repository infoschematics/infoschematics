import { Circle, MonitorPlay, Network, Satellite } from 'lucide-react'

export const scopeIcon = (key?: string) =>
  key === 'monitor-play' ? MonitorPlay : key === 'satellite' ? Satellite : key === 'network' ? Network : Circle
