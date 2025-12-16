# HR Rewards & Penalties and Salary Statistics Module

## Overview

This module extends the Human Resource management system with comprehensive features for managing employee rewards, penalties, and monthly salary statistics.

## Features

### 1. Rewards & Penalties Management (`/hr/reward-penalty`)

#### Reward Types
- **Performance Bonus** - For exceptional work performance
- **Attendance Bonus** - For consistent attendance
- **Project Completion** - For successfully completing projects
- **Innovation Award** - For creative solutions and innovations
- **Sales Commission** - For sales achievements
- **Referral Bonus** - For successful employee referrals
- **Annual Bonus** - Year-end bonuses
- **Holiday Bonus** - Tet/Holiday bonuses
- **Recognition Award** - General recognition awards
- **Overtime Bonus** - For overtime work
- **Other Reward** - Miscellaneous rewards

#### Penalty Types
- **Late Arrival** - Coming to work late
- **Early Leave** - Leaving work early
- **Absent Without Leave** - Unapproved absences
- **Policy Violation** - Violating company policies
- **Misconduct** - Professional misconduct
- **Performance Issue** - Poor work performance
- **Dress Code Violation** - Dress code breaches
- **Safety Violation** - Safety protocol breaches
- **Property Damage** - Damaging company property
- **Confidentiality Breach** - Leaking confidential information
- **Other Penalty** - Miscellaneous penalties

#### Workflow
1. **Create** - HR staff creates a reward/penalty record
2. **Pending** - Record awaits approval
3. **Approve/Reject** - Manager reviews and approves/rejects
4. **Applied** - Applied to employee's salary report

### 2. Salary Statistics (`/hr/salary-statistics`)

#### Features
- **Monthly Salary Reports** - Generate salary reports for all employees
- **Auto-calculation** including:
  - Basic salary
  - Overtime pay (1.5x rate)
  - Rewards (total from approved rewards)
  - Penalties (total from approved penalties)
  - Social Insurance (8% of salary, capped at 36M VND)
  - Health Insurance (1.5% of salary)
  - Unemployment Insurance (1% of salary)
  - Personal Income Tax (calculated)

#### Report Workflow
1. **Generate** - Create salary reports for a month
2. **Calculated** - System calculates all components
3. **Approved** - Manager approves the report
4. **Finalized** - Report is locked and ready for payment
5. **Paid** - Payment recorded

#### Statistics Dashboard
- Total employees
- Total basic salary
- Total rewards
- Total penalties
- Total net salary
- Department breakdown
- Top earners
- Payment status overview
- Monthly trends (last 6 months)

## API Endpoints

### Rewards & Penalties

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hr/reward-penalty` | List all records with filters |
| POST | `/api/hr/reward-penalty` | Create new record |
| GET | `/api/hr/reward-penalty/:id` | Get single record |
| PUT | `/api/hr/reward-penalty/:id` | Update record |
| DELETE | `/api/hr/reward-penalty/:id` | Delete record |
| POST | `/api/hr/reward-penalty/:id/approve` | Approve/Reject record |
| GET | `/api/hr/reward-penalty/stats` | Get statistics |

### Salary Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hr/salary-report` | List all reports with filters |
| POST | `/api/hr/salary-report` | Generate reports for a month |
| GET | `/api/hr/salary-report/:id` | Get single report |
| PUT | `/api/hr/salary-report/:id` | Update report |
| DELETE | `/api/hr/salary-report/:id` | Delete report |
| POST | `/api/hr/salary-report/:id/approve` | Approve/Finalize report |
| POST | `/api/hr/salary-report/:id/pay` | Record payment |
| GET | `/api/hr/salary-report/stats` | Get statistics |

## Database Models

### RewardPenalty
```typescript
{
  employee: ObjectId,          // Reference to Employee
  type: 'reward' | 'penalty',  // Type of record
  category: string,            // Category (see types above)
  title: string,               // Title/reason
  description: string,         // Detailed description
  amount: number,              // Amount in VND
  effective_date: Date,        // When it takes effect
  month: number,               // Month (1-12)
  year: number,                // Year
  status: 'pending' | 'approved' | 'rejected' | 'applied',
  approved_by: ObjectId,       // Who approved
  approved_date: Date,         // When approved
  rejection_reason: string,    // If rejected
  evidence_url: string,        // Supporting document
  notes: string                // Additional notes
}
```

### SalaryReport
```typescript
{
  employee: ObjectId,          // Reference to Employee
  month: number,               // Month (1-12)
  year: number,                // Year
  basic_salary: number,        // Base salary
  working_days: number,        // Working days in month
  present_days: number,        // Days worked
  absent_days: number,         // Days absent
  overtime_hours: number,      // Total overtime
  overtime_pay: number,        // Calculated overtime pay
  total_rewards: number,       // Sum of approved rewards
  reward_details: Array,       // List of rewards
  total_penalties: number,     // Sum of approved penalties
  penalty_details: Array,      // List of penalties
  allowances: Array,           // Additional allowances
  deductions: Array,           // Additional deductions
  social_insurance: number,    // BHXH (8%)
  health_insurance: number,    // BHYT (1.5%)
  unemployment_insurance: number, // BHTN (1%)
  personal_income_tax: number, // Tax
  gross_salary: number,        // Before deductions
  net_salary: number,          // Take-home pay
  payment_status: 'pending' | 'processing' | 'paid' | 'cancelled',
  status: 'draft' | 'calculated' | 'approved' | 'finalized'
}
```

## Navigation

The new features are accessible from the main menu under **Human Resource**:

- Employee
- Shift Management
- **Rewards & Penalties** (NEW)
- **Salary Statistics** (NEW)

## Integration with Existing Modules

- **Employee Module**: Links rewards/penalties to specific employees
- **Shift Module**: Uses shift data for calculating working days and overtime
- **Benefit Module**: Can be integrated for allowance calculations

## Usage Guide

### Adding a Reward
1. Go to `/hr/reward-penalty`
2. Click "🎁 Add Reward"
3. Select employee
4. Choose category (e.g., Performance Bonus)
5. Enter title, amount, and effective date
6. Add description and notes if needed
7. Click "Create"

### Adding a Penalty
1. Go to `/hr/reward-penalty`
2. Click "⚠️ Add Penalty"
3. Select employee
4. Choose category (e.g., Late Arrival)
5. Enter title, amount, and effective date
6. Add description and notes if needed
7. Click "Create"

### Generating Salary Reports
1. Go to `/hr/salary-statistics`
2. Select month and year
3. Click "📊 Generate Reports"
4. Review generated reports
5. Approve → Finalize → Pay

### Viewing Employee Records
1. Go to `/hr/employee`
2. Click on an employee to view details
3. Click "🎁 Rewards & Penalties" button
4. View employee's reward/penalty history and salary reports
