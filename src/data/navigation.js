import {
  LayoutDashboard, MapPin, Route as RouteIcon, Network, GitBranch,
  BarChart3, PlayCircle, Settings as SettingsIcon,
} from 'lucide-react';

export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard, description: 'Network health and optimization overview' },
      { path: '/graph', label: 'Network Graph', icon: Network, description: 'Interactive visualization of locations and routes' },
    ],
  },
  {
    label: 'Network data',
    items: [
      { path: '/locations', label: 'Locations', icon: MapPin, description: 'Manage warehouses, hubs and delivery zones' },
      { path: '/routes', label: 'Routes', icon: RouteIcon, description: 'Manage weighted connections between locations' },
    ],
  },
  {
    label: 'Optimization',
    items: [
      { path: '/optimizer', label: 'MST Optimizer', icon: GitBranch, description: 'Run Prim’s and Kruskal’s minimum spanning tree algorithms' },
      { path: '/comparison', label: 'Algorithm Comparison', icon: BarChart3, description: 'Compare measured algorithm performance' },
      { path: '/simulation', label: 'Simulation', icon: PlayCircle, description: 'Generate and benchmark synthetic networks' },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/settings', label: 'Settings', icon: SettingsIcon, description: 'Application, graph and simulation preferences' },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);
