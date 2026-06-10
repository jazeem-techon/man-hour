export interface Employee {
  _id: string
  name: string
  email: string
  department: string
  isActive: boolean
  isOnLeave: boolean
  currentLeaveType: '' | 'combo_off' | 'sick_leave' | 'no_paid'
}

export interface Project {
  _id: string
  name: string
  salespersonId: string
  isActive: boolean
  createdAt: string
}

export interface Salesperson {
  _id: string
  name: string
  email: string
  createdAt: string
}

export interface ManHour {
  _id: string
  projectId: string
  employeeId: string
  hours: number
  note: string
  date: string
}

export interface Leave {
  _id: string
  employeeId: string
  leaveType: 'combo_off' | 'sick_leave' | 'no_paid'
  startDate: string
  endDate: string
  status: 'active' | 'ended'
  note: string
}
