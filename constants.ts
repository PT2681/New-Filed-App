import { Feature, Project, TrainingSession, Tour, Notification } from './types';

export const APP_NAME = 'Nexby Field-Force Pro';

export const FEATURES: Feature[] = [
  {
    id: 'projects',
    title: 'Project Management',
    description: 'Track assigned projects, timelines, and visit status.',
    iconName: 'Briefcase',
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    id: 'training',
    title: 'Training Management',
    description: 'Manage training sessions, attendance, and locations.',
    iconName: 'GraduationCap',
    color: 'bg-teal-100 text-teal-600',
  },
  {
    id: 'tours',
    title: 'Tour & Visit',
    description: 'Manage travel, track visits, and claim expenses.',
    iconName: 'Map',
    color: 'bg-orange-100 text-orange-600',
  },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'P-101',
    name: "Solar Panel Installation - North Zone",
    description: "Installation and verification of solar units across 50 residential properties in Sector 4. Requires site survey and customer sign-off.",
    type: "Infrastructure",
    startDate: "2023-11-01",
    endDate: "2023-12-15",
    status: "Active",
    visitsCompleted: 12
  },
  {
    id: 'P-102',
    name: "Fiber Optic Maintenance - Downtown",
    description: "Routine maintenance and signal testing for underground fiber lines. Check junction boxes and replace faulty connectors.",
    type: "Maintenance",
    startDate: "2023-11-05",
    endDate: "2023-11-20",
    status: "Active",
    visitsCompleted: 5
  },
  {
    id: 'P-103',
    name: "Smart Meter Upgrade Campaign",
    description: "Replacing old electric meters with smart IOT enabled meters for commercial complex. Team B coordination required.",
    type: "Upgrade",
    startDate: "2023-10-01",
    endDate: "2023-10-31",
    status: "Completed",
    visitsCompleted: 45
  },
  {
    id: 'P-104',
    name: "Network Expansion - Industrial Area",
    description: "Laying new cables and setting up distribution points. Pending municipal approval for digging.",
    type: "Expansion",
    startDate: "2023-12-01",
    endDate: "2024-01-15",
    status: "Hold",
    visitsCompleted: 0
  },
  {
    id: 'P-105',
    name: "Client Site Audit - West Wing",
    description: "Annual safety and compliance audit for client premises. Documentation review.",
    type: "Audit",
    startDate: "2023-09-15",
    endDate: "2023-09-20",
    status: "Cancelled",
    visitsCompleted: 2
  }
];

// Helper to get today's date at specific hour
const todayAt = (hour: number) => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const futureDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const pastDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

export const MOCK_TRAINING_SESSIONS: TrainingSession[] = [
  // --- Take Training (Trainee) ---
  {
    id: 'T-101',
    projectName: 'Solar Panel Safety',
    topic: 'Site Safety Protocols',
    description: 'Mandatory safety training for all field engineers working on high-voltage solar installations. Covers PPE and emergency response.',
    startDate: todayAt(9), // Today at 9 AM (Likely due)
    endDate: todayAt(11),
    locationName: 'North Zone Office, Conf Room A',
    locationCoords: { lat: 37.7749, lng: -122.4194 },
    role: 'TRAINEE',
    status: 'Due',
  },
  {
    id: 'T-102',
    projectName: 'Fiber Optics 101',
    topic: 'Splicing Techniques',
    description: 'Hands-on workshop for optical fiber splicing and testing using OTDR machines.',
    startDate: futureDate(2),
    endDate: futureDate(2),
    locationName: 'Training Center, Downtown',
    locationCoords: { lat: 37.7849, lng: -122.4294 },
    role: 'TRAINEE',
    status: 'Due',
  },
  {
    id: 'T-103',
    projectName: 'HR Policy',
    topic: 'Annual Compliance Update',
    description: 'Yearly review of company policies, leave management, and expense reporting.',
    startDate: pastDate(5),
    endDate: pastDate(5),
    locationName: 'Online / Remote',
    locationCoords: { lat: 0, lng: 0 },
    role: 'TRAINEE',
    status: 'Completed',
  },

  // --- Give Training (Trainer) ---
  {
    id: 'G-201',
    projectName: 'Smart Meter Installation',
    topic: 'Batch 5 - Junior Technicians',
    description: 'Train new joiners on the standard operating procedure for smart meter deployment and app usage.',
    startDate: todayAt(14), // Today at 2 PM
    endDate: todayAt(17),
    locationName: 'West Wing Assembly Hall',
    locationCoords: { lat: 37.7649, lng: -122.4094 },
    role: 'TRAINER',
    status: 'Due',
  },
  {
    id: 'G-202',
    projectName: 'Customer Soft Skills',
    topic: 'Handling Customer Complaints',
    description: 'Workshop for support staff on de-escalation techniques.',
    startDate: pastDate(10),
    endDate: pastDate(10),
    locationName: 'East Side Branch',
    locationCoords: { lat: 37.7549, lng: -122.4394 },
    role: 'TRAINER',
    status: 'Cancelled',
  },
  {
    id: 'G-203',
    projectName: 'Project Mgmt Basics',
    topic: 'Field Leads Orientation',
    description: 'Training field leads on how to use the new project management module.',
    startDate: pastDate(2),
    endDate: pastDate(2),
    locationName: 'Headquarters',
    locationCoords: { lat: 37.7949, lng: -122.3994 },
    role: 'TRAINER',
    status: 'Completed',
  }
];

export const MOCK_TOURS: Tour[] = [
  {
    id: 'TR-001',
    projectId: 'P-101',
    projectName: 'Solar Panel Installation',
    taskName: 'Site Survey',
    fromLocation: 'Headquarters',
    toLocation: 'Sector 4, North Zone',
    toCoordinates: { lat: 37.7749, lng: -122.4194 },
    startDate: todayAt(8),
    endDate: todayAt(18),
    status: 'Upcoming',
    advanceAmount: 500
  },
  {
    id: 'TR-002',
    projectId: 'P-102',
    projectName: 'Fiber Optic Maintenance',
    taskName: 'Cable Testing',
    fromLocation: 'Downtown Office',
    toLocation: 'Industrial Park Block C',
    toCoordinates: { lat: 37.7849, lng: -122.4294 },
    startDate: futureDate(1),
    endDate: futureDate(1),
    status: 'Upcoming',
    travelType: 'Pool'
  },
  {
    id: 'TR-003',
    projectId: 'P-103',
    projectName: 'Smart Meter Upgrade',
    taskName: 'Installation Batch 1',
    fromLocation: 'Warehouse',
    toLocation: 'City Mall Complex',
    toCoordinates: { lat: 37.7649, lng: -122.4094 },
    startDate: pastDate(2),
    endDate: pastDate(2),
    status: 'Completed',
    transportMode: 'Bike',
    distanceCovered: 24,
    weatherData: 'Sunny',
    actualStartDate: pastDate(2),
    actualEndDate: pastDate(2),
    travelType: 'Individual'
  },
  {
    id: 'TR-004',
    projectId: 'P-105',
    projectName: 'Client Site Audit',
    taskName: 'Safety Audit',
    fromLocation: 'HQ',
    toLocation: 'West Wing Factory',
    toCoordinates: { lat: 37.7549, lng: -122.4394 },
    startDate: pastDate(5),
    endDate: pastDate(5),
    status: 'Claimed',
    claimStatus: 'Paid',
    claimAmount: 1200,
    transportMode: 'Car',
    distanceCovered: 45,
    weatherData: 'Rainy',
    travelType: 'Individual'
  },
   {
    id: 'TR-005',
    projectId: 'P-105',
    projectName: 'Client Site Audit',
    taskName: 'Docs Submission',
    fromLocation: 'HQ',
    toLocation: 'West Wing Factory',
    toCoordinates: { lat: 37.7549, lng: -122.4394 },
    startDate: pastDate(3),
    endDate: pastDate(3),
    status: 'Claimed',
    claimStatus: 'Due',
    claimAmount: 350,
    transportMode: 'Bike',
    distanceCovered: 12,
    weatherData: 'Clear',
    travelType: 'Individual'
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'PROJECT_ASSIGNED',
    title: 'New Project Assigned',
    message: 'You have been assigned to "Solar Panel Installation - North Zone". Check details now.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    read: false,
    referenceId: 'P-101',
    route: '/projects/P-101'
  },
  {
    id: 'n2',
    type: 'TRAINING_ASSIGNED',
    title: 'Training Due Tomorrow',
    message: 'Mandatory session "Solar Panel Safety" is scheduled for tomorrow at 9 AM.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    read: false,
    referenceId: 'T-101',
    route: '/training'
  },
  {
    id: 'n3',
    type: 'CLAIM_PAID',
    title: 'Expense Claim Approved',
    message: 'Your claim for "Client Site Audit" (TR-004) has been processed. Amount: $1200.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    referenceId: 'TR-004',
    route: '/tours'
  },
  {
    id: 'n4',
    type: 'GENERAL',
    title: 'System Maintenance',
    message: 'The system will be undergoing maintenance on Sunday from 2 AM to 4 AM.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    read: true,
  }
];