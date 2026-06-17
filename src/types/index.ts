export interface Employee {
  _id: string
  name: string
  email: string
  department: string
  isActive: boolean
  isOnLeave: boolean
  currentLeaveType: '' | 'combo_off' | 'sick_leave' | 'no_paid'
}

export interface Customer {
  _id: string
  name: string
  email?: string
  phone?: string
}

export interface Project {
  _id: string
  projectName: string
  projectId: string // Auto-generated display code e.g. "PRJ-103"
  customerId: Customer
  billingMethod: 'Fixed Cost for Project' | 'Based on Project Hours' | 'Based on Task Hours' | 'Based on Staff Hours'
  isActive: boolean
  projectDate: string
  tasks?: any[]
  financials?: {
    revenue: number
    laborCost: number
    expenseCost: number
    totalCost: number
    grossProfit: number
    margin: number
    loggedHours: number
  }
  // Legacy fields kept for backward compat with mock data
  name?: string
  salespersonId?: string
  customer?: string
  revenue?: number
  purchaseCost?: number
}

export interface Salesperson {
  _id: string
  name: string
  email: string
  branchId?: string
  createdAt: string
  updatedAt?: string
  target?: {
    _id: string
    revenueTarget: number
    gpTarget: number
    netProfitTarget: number
    month: number
    year: number
  }
  actuals?: {
    revenue: number
    laborCost: number
    expenseCost: number
    totalCost: number
    grossProfit: number
    margin: number
    loggedHours: number
  }
}

export interface ManHour {
  _id: string
  projectId: string | { _id: string; projectName: string; projectId: string }
  employeeId: string | { _id: string; name: string }
  task: string
  hours: number
  note: string
  date: string
  createdAt?: string
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

export type UserRole = 'CompanyAdmin' | 'Salesperson' | 'User'
