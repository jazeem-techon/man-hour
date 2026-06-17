

export const salespersons: any[] = [
  { _id: 's1', name: 'Ahmed Al Mansoori', email: 'ahmed@company.ae', createdAt: '2024-01-10' },
  { _id: 's2', name: 'Sara Al Zaabi', email: 'sara@company.ae', createdAt: '2024-01-15' },
  { _id: 's3', name: 'Khalid Rahman', email: 'khalid@company.ae', createdAt: '2024-02-01' },
]

export const employees: any[] = [
  { _id: 'e1', name: 'Mohammed Al Hashimi', email: 'mo@company.ae', department: 'Engineering', isActive: true, isOnLeave: false, currentLeaveType: '' },
  { _id: 'e2', name: 'Fatima Al Nuaimi', email: 'fatima@company.ae', department: 'Design', isActive: true, isOnLeave: true, currentLeaveType: 'sick_leave' },
  { _id: 'e3', name: 'Omar Khalifa', email: 'omar@company.ae', department: 'Engineering', isActive: true, isOnLeave: false, currentLeaveType: '' },
  { _id: 'e4', name: 'Aisha Al Mulla', email: 'aisha@company.ae', department: 'Management', isActive: true, isOnLeave: false, currentLeaveType: '' },
  { _id: 'e5', name: 'Rashid Al Suwaidi', email: 'rashid@company.ae', department: 'Engineering', isActive: false, isOnLeave: false, currentLeaveType: '' },
  { _id: 'e6', name: 'Noura Al Shamsi', email: 'noura@company.ae', department: 'Design', isActive: true, isOnLeave: false, currentLeaveType: '' },
]

export const projects: any[] = [
  { _id: 'p1', name: 'Abu Dhabi Metro Expansion', salespersonId: 's1', isActive: true, projectDate: '2024-01-20', customer: 'Abu Dhabi Transport', revenue: 500000, purchaseCost: 150000 },
  { _id: 'p2', name: 'ADNOC Digital Infrastructure', salespersonId: 's2', isActive: true, projectDate: '2024-02-05', customer: 'ADNOC', revenue: 750000, purchaseCost: 200000 },
  { _id: 'p3', name: 'Dubai Mall ELV System', salespersonId: 's1', isActive: true, projectDate: '2024-02-15', customer: 'Emaar', revenue: 300000, purchaseCost: 80000 },
  { _id: 'p4', name: 'Etihad HQ Retrofit', salespersonId: 's3', isActive: false, projectDate: '2024-03-01', customer: 'Etihad Airways', revenue: 200000, purchaseCost: 60000 },
]

export const manHours: any[] = [
  { _id: 'mh1', projectId: 'p1', employeeId: 'e1', hours: 8, note: 'Cable tray installation', date: '2024-06-01' },
  { _id: 'mh2', projectId: 'p1', employeeId: 'e3', hours: 6, note: 'Site inspection', date: '2024-06-01' },
  { _id: 'mh3', projectId: 'p2', employeeId: 'e1', hours: 7.5, note: 'Server room setup', date: '2024-06-02' },
  { _id: 'mh4', projectId: 'p2', employeeId: 'e4', hours: 4, note: 'Client meeting', date: '2024-06-02' },
  { _id: 'mh5', projectId: 'p3', employeeId: 'e3', hours: 8, note: 'CCTV installation', date: '2024-06-03' },
  { _id: 'mh6', projectId: 'p3', employeeId: 'e6', hours: 5, note: 'Access control wiring', date: '2024-06-03' },
  { _id: 'mh7', projectId: 'p1', employeeId: 'e1', hours: 8, note: 'Panel testing', date: '2024-06-04' },
  { _id: 'mh8', projectId: 'p2', employeeId: 'e3', hours: 6, note: 'Network patching', date: '2024-06-04' },
  { _id: 'mh9', projectId: 'p1', employeeId: 'e4', hours: 3, note: 'Progress report', date: '2024-06-05' },
  { _id: 'mh10', projectId: 'p3', employeeId: 'e6', hours: 7, note: 'Fire alarm setup', date: '2024-06-05' },
  { _id: 'mh11', projectId: 'p2', employeeId: 'e1', hours: 8, note: 'UPS installation', date: '2024-06-06' },
  { _id: 'mh12', projectId: 'p3', employeeId: 'e3', hours: 4, note: 'Testing & commissioning', date: '2024-06-07' },
]

export const leaves: any[] = [
  { _id: 'l1', employeeId: 'e2', leaveType: 'sick_leave', startDate: '2024-06-03', endDate: '2024-06-10', status: 'active', note: 'Medical certificate submitted' },
  { _id: 'l2', employeeId: 'e5', leaveType: 'no_paid', startDate: '2024-05-20', endDate: '2024-05-30', status: 'ended', note: 'Personal travel' },
  { _id: 'l3', employeeId: 'e1', leaveType: 'combo_off', startDate: '2024-05-10', endDate: '2024-05-11', status: 'ended', note: '' },
]
