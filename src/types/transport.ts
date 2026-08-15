export interface TransportRoute {
  id: string;
  name: string;
  driverId: string;
  busPlate: string;
  stops: string[];
  schoolId: string;
  startTime: string;
  status: 'idle' | 'in_transit' | 'delayed' | 'completed';
  currentLocation?: { lat: number; lng: number };
}

export interface StudentTransportStatus {
  id: string;
  studentName: string;
  routeId: string;
  status: 'waiting' | 'picked_up' | 'dropped_off' | 'absent';
  timestamp?: number;
  stopName: string;
  parentId: string;
  shift?: 'morning' | 'evening' | 'both';
}

export interface TransportFee {
  id: string;
  studentId: string;
  parentId: string;
  amount: number;
  dueDate: number;
  status: 'paid' | 'pending' | 'overdue';
  month: string;
}

export interface BusDriver {
  id: string;
  name: string;
  phone: string;
  routeId?: string;
  schoolId: string;
  accessCode?: string;
  shift?: 'morning' | 'evening' | 'both';
  busNumber?: string;
  status?: 'active' | 'inactive';
}
