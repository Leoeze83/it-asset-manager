export type AssetType = 'Laptop' | 'Desktop' | 'Server' | 'Monitor' | 'Printer' | 'Other';
export type AssetStatus = 'Active' | 'Maintenance' | 'Retired' | 'In Storage';
export type UserRole = 'Admin' | 'Staff';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  serialNumber: string;
  status: AssetStatus;
  assignedTo?: string;
  location?: string;
  purchaseDate?: string;
  specs?: string;
  lastSeen?: any;
  realtime?: {
    cpu?: number;
    ram?: number;
    disk?: number;
    screenshot?: string;
  };
  createdAt: any;
  updatedAt: any;
}

export interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
  role: UserRole;
  photoURL?: string;
}

export interface MaintenanceLog {
  id: string;
  assetId: string;
  date: any;
  description: string;
  performedBy: string;
}
