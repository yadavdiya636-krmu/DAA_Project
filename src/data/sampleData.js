export const LOCATION_TYPES = [
  'Warehouse',
  'Delivery Hub',
  'Distribution Center',
  'Retail Store',
  'Customer Zone',
];

export const ROUTE_TYPES = ['Highway', 'Express', 'Local', 'Air', 'Rail'];

export const sampleLocations = [
  { id: 'L01', name: 'Central Warehouse', code: 'CW-01', city: 'New York', type: 'Warehouse', description: 'Primary sorting and dispatch facility serving the metro region.' },
  { id: 'L02', name: 'North Hub', code: 'NH-02', city: 'Boston', type: 'Delivery Hub', description: 'Regional hub covering northern delivery corridors.' },
  { id: 'L03', name: 'South Hub', code: 'SH-03', city: 'Atlanta', type: 'Delivery Hub', description: 'Last-mile distribution point for southern territories.' },
  { id: 'L04', name: 'East Distribution Center', code: 'ED-04', city: 'Philadelphia', type: 'Distribution Center', description: 'High-capacity cross-dock center near the eastern port.' },
  { id: 'L05', name: 'West Distribution Center', code: 'WD-05', city: 'Chicago', type: 'Distribution Center', description: 'Bulk storage and inbound freight consolidation.' },
  { id: 'L06', name: 'City Market', code: 'CM-06', city: 'New York', type: 'Retail Store', description: 'Downtown retail touchpoint with same-day fulfillment.' },
  { id: 'L07', name: 'Airport Hub', code: 'AH-07', city: 'Dallas', type: 'Distribution Center', description: 'Air-freight gateway for time-sensitive shipments.' },
  { id: 'L08', name: 'Industrial Zone', code: 'IZ-08', city: 'Detroit', type: 'Customer Zone', description: 'Industrial customer cluster with scheduled deliveries.' },
  { id: 'L09', name: 'Riverside Outlet', code: 'RO-09', city: 'Miami', type: 'Retail Store', description: 'Coastal outlet with seasonal demand peaks.' },
];

export const sampleRoutes = [
  { id: 'R01', source: 'L01', target: 'L02', distance: 306, cost: 120, type: 'Highway', description: 'Main northbound highway corridor.' },
  { id: 'R02', source: 'L01', target: 'L03', distance: 430, cost: 180, type: 'Highway', description: 'Long-haul southern connector.' },
  { id: 'R03', source: 'L01', target: 'L04', distance: 130, cost: 95, type: 'Express', description: 'Fast eastern link.' },
  { id: 'R04', source: 'L01', target: 'L05', distance: 505, cost: 210, type: 'Rail', description: 'Westbound rail freight lane.' },
  { id: 'R05', source: 'L01', target: 'L06', distance: 18, cost: 60, type: 'Local', description: 'Short intra-city delivery route.' },
  { id: 'R06', source: 'L02', target: 'L04', distance: 300, cost: 130, type: 'Highway', description: 'Northeast regional connection.' },
  { id: 'R07', source: 'L02', target: 'L05', distance: 610, cost: 240, type: 'Rail', description: 'Northern rail transfer lane.' },
  { id: 'R08', source: 'L03', target: 'L09', distance: 660, cost: 150, type: 'Highway', description: 'Coastal southbound corridor.' },
  { id: 'R09', source: 'L04', target: 'L06', distance: 95, cost: 85, type: 'Local', description: 'Metro area distribution link.' },
  { id: 'R10', source: 'L05', target: 'L08', distance: 175, cost: 110, type: 'Express', description: 'Industrial zone service lane.' },
  { id: 'R11', source: 'L05', target: 'L07', distance: 480, cost: 190, type: 'Air', description: 'Air freight connection from the west.' },
  { id: 'R12', source: 'L07', target: 'L08', distance: 355, cost: 140, type: 'Highway', description: 'Central inland connector.' },
  { id: 'R13', source: 'L07', target: 'L03', distance: 430, cost: 260, type: 'Air', description: 'Priority cross-region air lane.' },
  { id: 'R14', source: 'L08', target: 'L02', distance: 690, cost: 310, type: 'Rail', description: 'Northern industrial freight lane.' },
  { id: 'R15', source: 'L06', target: 'L09', distance: 950, cost: 220, type: 'Express', description: 'Metro-to-coast express service.' },
];

export const samplePositions = {
  L01: { x: 450, y: 280 },
  L02: { x: 400, y: 90 },
  L03: { x: 380, y: 470 },
  L04: { x: 650, y: 160 },
  L05: { x: 210, y: 210 },
  L06: { x: 620, y: 360 },
  L07: { x: 175, y: 430 },
  L08: { x: 90, y: 320 },
  L09: { x: 660, y: 500 },
};

export function makeSampleActivities() {
  const base = Date.now();
  return [
    { id: 'A-S3', type: 'sample', message: 'Sample delivery network loaded with 9 locations and 15 routes.', timestamp: base - 1000 * 60 * 3 },
    { id: 'A-S2', type: 'system', message: 'RouteWise workspace initialized successfully.', timestamp: base - 1000 * 60 * 4 },
    { id: 'A-S1', type: 'system', message: 'Minimum spanning tree algorithms are ready to run.', timestamp: base - 1000 * 60 * 5 },
  ];
}

export function getSampleData() {
  return {
    locations: sampleLocations.map((item) => ({ ...item })),
    routes: sampleRoutes.map((item) => ({ ...item })),
    positions: Object.fromEntries(Object.entries(samplePositions).map(([k, v]) => [k, { ...v }])),
    activities: makeSampleActivities(),
  };
}
