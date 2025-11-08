export interface Location {
  lat: number;
  lng: number;
}

export interface Incident {
  id: string;
  type: 'Flood' | 'Fire' | 'Storm' | 'Earthquake';
  location: Location;
  timestamp: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  needs: string[];
  severity: 'Low' | 'Medium' | 'High';
}

export interface Pledge {
  id: string;
  type: 'Food' | 'Shelter' | 'Transport' | 'Skills';
  location: Location;
  name: string;
  resource: string;
  quantity: number;
}

export const incidents: Incident[] = [
  {
    id: 'inc-1',
    type: 'Flood',
    location: { lat: 34.0522, lng: -118.2437 },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    description: 'Major flooding in downtown LA after heavy rainfall. Streets are impassable.',
    imageUrl: 'https://picsum.photos/seed/101/600/400',
    imageHint: 'city flood',
    needs: ['Evacuation', 'Shelter', 'Clean Water'],
    severity: 'High',
  },
  {
    id: 'inc-2',
    type: 'Fire',
    location: { lat: 34.1522, lng: -118.4437 },
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    description: 'Brush fire spreading near the Hollywood Hills. Air quality is poor.',
    imageUrl: 'https://picsum.photos/seed/102/600/400',
    imageHint: 'forest fire',
    needs: ['Medical Assistance', 'Air Filters'],
    severity: 'Medium',
  },
  {
    id: 'inc-3',
    type: 'Storm',
    location: { lat: 33.9522, lng: -118.3437 },
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    description: 'Severe storm damage. Power lines are down.',
    imageUrl: 'https://picsum.photos/seed/103/600/400',
    imageHint: 'storm damage',
    needs: ['Power Generator', 'Repair services'],
    severity: 'Medium',
  },
];

export const pledges: Pledge[] = [
  {
    id: 'pld-1',
    type: 'Shelter',
    location: { lat: 34.0600, lng: -118.2500 },
    name: 'Community Center',
    resource: 'Beds',
    quantity: 20,
  },
  {
    id: 'pld-2',
    type: 'Food',
    location: { lat: 34.0450, lng: -118.2300 },
    name: 'Downtown Restaurant',
    resource: 'Hot Meals',
    quantity: 150,
  },
  {
    id: 'pld-3',
    type: 'Transport',
    location: { lat: 34.0722, lng: -118.2437 },
    name: 'Volunteer Driver Group',
    resource: 'Seats in Van',
    quantity: 6,
  },
  {
    id: 'pld-4',
    type: 'Skills',
    location: { lat: 34.1600, lng: -118.4500 },
    name: 'Jane Doe',
    resource: 'Certified Nurse',
    quantity: 1,
  },
];

export const alerts = [
  {
    id: 'alert-1',
    type: 'Flood',
    title: 'High-Severity Flood Alert!',
    description: 'A major flood has been reported in Downtown LA. Authorities advise immediate evacuation of low-lying areas. Seek higher ground.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'alert-2',
    type: 'Fire',
    title: 'New Aid Pledged: Medical Supplies',
    description: 'A volunteer has pledged first-aid kits near the Hollywood Hills fire. Available for pickup.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'alert-3',
    type: 'Storm',
    title: 'Power Outage Reported',
    description: 'Widespread power outages due to storm damage have been confirmed. Repair crews are dispatched.',
    timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    read: true,
  }
]
