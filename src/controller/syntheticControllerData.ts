import type { ControllerRecord } from './financeControllerTypes'

// 56 deterministic synthetic records for Razorpay Track 4 testing
// Clearly labeled as SYNTHETIC DEMO DATA for judges.
export const SYNTHETIC_CONTROLLER_RECORDS: ControllerRecord[] = [
  // Pair 1: Perfect Match
  {
    id: 'rec-001',
    referenceId: 'pay_M9k02x18a',
    type: 'PAYMENT',
    source: 'Razorpay Gateway',
    amount: 14500,
    date: '2026-08-25',
    status: 'captured',
    customerEmail: 'rohit.v@techcorp.in',
    merchantId: 'mid_finova_in',
    description: 'Enterprise Annual Tier License Payment'
  },
  {
    id: 'rec-002',
    referenceId: 'pay_M9k02x18a',
    type: 'SETTLEMENT',
    source: 'Bank Settlement (HDFC)',
    amount: 14500,
    date: '2026-08-26',
    status: 'settled',
    customerEmail: 'rohit.v@techcorp.in',
    merchantId: 'mid_finova_in',
    description: 'Bank Credit: Batch #SETL-20260826-01'
  },

  // Pair 2: Amount Mismatch (User spec example: 7200 vs 6900, diff 300)
  {
    id: 'rec-003',
    referenceId: 'pay_N8s9A2k1',
    type: 'PAYMENT',
    source: 'Razorpay Gateway',
    amount: 7200,
    date: '2026-08-24',
    status: 'captured',
    customerEmail: 'ananya.s@designstudio.co',
    merchantId: 'mid_finova_in',
    description: 'Quarterly Cloud Workspace Subscription'
  },
  {
    id: 'rec-004',
    referenceId: 'pay_N8s9A2k1',
    type: 'SETTLEMENT',
    source: 'Bank Settlement (HDFC)',
    amount: 6900,
    date: '2026-08-25',
    status: 'settled',
    customerEmail: 'ananya.s@designstudio.co',
    merchantId: 'mid_finova_in',
    description: 'Bank Credit: Unexplained net discount fee deduction'
  },

  // Pair 3: Perfect Match
  {
    id: 'rec-005',
    referenceId: 'pay_P7x11k92b',
    type: 'PAYMENT',
    source: 'Razorpay Gateway',
    amount: 3200,
    date: '2026-08-25',
    status: 'captured',
    customerEmail: 'vikram.mehta@orbit.ai',
    merchantId: 'mid_finova_in',
    description: 'Monthly Developer API Seat'
  },
  {
    id: 'rec-006',
    referenceId: 'pay_P7x11k92b',
    type: 'SETTLEMENT',
    source: 'Bank Settlement (HDFC)',
    amount: 3200,
    date: '2026-08-26',
    status: 'settled',
    customerEmail: 'vikram.mehta@orbit.ai',
    merchantId: 'mid_finova_in',
    description: 'Bank Credit: Batch #SETL-20260826-02'
  },

  // Case 4: Missing Settlement (Payment captured 5 days ago, never settled)
  {
    id: 'rec-007',
    referenceId: 'pay_Q6w45z88c',
    type: 'PAYMENT',
    source: 'Razorpay Gateway',
    amount: 18500,
    date: '2026-08-21',
    status: 'captured',
    customerEmail: 'finance@stellarlogistics.com',
    merchantId: 'mid_finova_in',
    description: 'Logistics Router Integration Plan'
  },

  // Case 5: Duplicate Gateway Capture
  {
    id: 'rec-008',
    referenceId: 'pay_R5v32m77d',
    type: 'PAYMENT',
    source: 'Razorpay Gateway',
    amount: 4500,
    date: '2026-08-23',
    status: 'captured',
    customerEmail: 'deepak.c@cloudops.org',
    merchantId: 'mid_finova_in',
    description: 'Cloudops Webhook Connector - Attempt 1'
  },
  {
    id: 'rec-009',
    referenceId: 'pay_R5v32m77d',
    type: 'PAYMENT',
    source: 'Razorpay Gateway',
    amount: 4500,
    date: '2026-08-23',
    status: 'captured',
    customerEmail: 'deepak.c@cloudops.org',
    merchantId: 'mid_finova_in',
    description: 'Cloudops Webhook Connector - Double Callback'
  },

  // Pair 6: Perfect Match
  {
    id: 'rec-010',
    referenceId: 'pay_S4u21n66e',
    type: 'PAYMENT',
    source: 'Razorpay Gateway',
    amount: 8900,
    date: '2026-08-24',
    status: 'captured',
    customerEmail: 'priyanka.k@fintechasia.com',
    merchantId: 'mid_finova_in',
    description: 'Compliance Validation Tooling'
  },
  {
    id: 'rec-011',
    referenceId: 'pay_S4u21n66e',
    type: 'SETTLEMENT',
    source: 'Bank Settlement (HDFC)',
    amount: 8900,
    date: '2026-08-25',
    status: 'settled',
    customerEmail: 'priyanka.k@fintechasia.com',
    merchantId: 'mid_finova_in',
    description: 'Bank Credit: Batch #SETL-20260825-04'
  },

  // Pair 7: Date Mismatch (T+12 days late settlement)
  {
    id: 'rec-012',
    referenceId: 'pay_T3t10p55f',
    type: 'PAYMENT',
    source: 'Razorpay Gateway',
    amount: 12000,
    date: '2026-08-10',
    status: 'captured',
    customerEmail: 'manish.g@infraops.in',
    merchantId: 'mid_finova_in',
    description: 'Server Node Provisioning'
  },
  {
    id: 'rec-013',
    referenceId: 'pay_T3t10p55f',
    type: 'SETTLEMENT',
    source: 'Bank Settlement (HDFC)',
    amount: 12000,
    date: '2026-08-26',
    status: 'settled',
    customerEmail: 'manish.g@infraops.in',
    merchantId: 'mid_finova_in',
    description: 'Late Bank Credit: Delayed clearing cycle'
  },

  // Pair 8: Status Mismatch (Refunded in gateway, but bank shows capture settled)
  {
    id: 'rec-014',
    referenceId: 'pay_U2s09q44g',
    type: 'PAYMENT',
    source: 'Razorpay Gateway',
    amount: 5500,
    date: '2026-08-22',
    status: 'refunded',
    customerEmail: 'neha.r@startuphub.in',
    merchantId: 'mid_finova_in',
    description: 'Customer canceled within 2 hours'
  },
  {
    id: 'rec-015',
    referenceId: 'pay_U2s09q44g',
    type: 'SETTLEMENT',
    source: 'Bank Settlement (HDFC)',
    amount: 5500,
    date: '2026-08-23',
    status: 'settled',
    customerEmail: 'neha.r@startuphub.in',
    merchantId: 'mid_finova_in',
    description: 'Settled despite merchant refund flag'
  },

  // Pair 9: Perfect Match
  {
    id: 'rec-016',
    referenceId: 'pay_V1r98r33h',
    type: 'PAYMENT',
    source: 'Razorpay Gateway',
    amount: 2400,
    date: '2026-08-24',
    status: 'captured',
    customerEmail: 'karan.j@creativemedia.io',
    merchantId: 'mid_finova_in',
    description: 'Single Asset Pack Download'
  },
  {
    id: 'rec-017',
    referenceId: 'pay_V1r98r33h',
    type: 'SETTLEMENT',
    source: 'Bank Settlement (HDFC)',
    amount: 2400,
    date: '2026-08-25',
    status: 'settled',
    customerEmail: 'karan.j@creativemedia.io',
    merchantId: 'mid_finova_in',
    description: 'Bank Credit: Batch #SETL-20260825-05'
  },

  // Pair 10: Missing Payment (Bank received settlement with no matching gateway charge)
  {
    id: 'rec-018',
    referenceId: 'pay_UNKNOWN_882',
    type: 'SETTLEMENT',
    source: 'Bank Settlement (HDFC)',
    amount: 1650,
    date: '2026-08-25',
    status: 'settled',
    customerEmail: 'unknown@payee.com',
    merchantId: 'mid_finova_in',
    description: 'Unmatched Inbound Clearing Credit'
  },

  // Perfect Matches batch (rec 19 - 40)
  ...Array.from({ length: 11 }).flatMap((_, i) => {
    const ref = `pay_AUTOGEN_${100 + i}`
    const amt = [1800, 2900, 4200, 6500, 9800, 11200, 15000, 8400, 3100, 7700, 12500][i]
    return [
      {
        id: `rec-${19 + i * 2}`,
        referenceId: ref,
        type: 'PAYMENT' as const,
        source: 'Razorpay Gateway' as const,
        amount: amt,
        date: `2026-08-${15 + (i % 10)}`,
        status: 'captured' as const,
        customerEmail: `client_${i + 1}@enterprise.in`,
        merchantId: 'mid_finova_in',
        description: `B2B Platform Access Fee #${i + 101}`
      },
      {
        id: `rec-${20 + i * 2}`,
        referenceId: ref,
        type: 'SETTLEMENT' as const,
        source: 'Bank Settlement (HDFC)' as const,
        amount: amt,
        date: `2026-08-${16 + (i % 10)}`,
        status: 'settled' as const,
        customerEmail: `client_${i + 1}@enterprise.in`,
        merchantId: 'mid_finova_in',
        description: `Automated Bank Clearing Ref #${ref}`
      }
    ]
  }),

  // Orders and ERP Expenses records (rec 41 - 56)
  {
    id: 'rec-041',
    referenceId: 'ord_OR788910',
    type: 'ORDER',
    source: 'Internal Order Ledger',
    amount: 14500,
    date: '2026-08-25',
    status: 'captured',
    customerEmail: 'rohit.v@techcorp.in',
    description: 'Order confirmed by checkout system'
  },
  {
    id: 'rec-042',
    referenceId: 'ord_OR788911',
    type: 'ORDER',
    source: 'Internal Order Ledger',
    amount: 7200,
    date: '2026-08-24',
    status: 'captured',
    customerEmail: 'ananya.s@designstudio.co',
    description: 'Order confirmed by checkout system'
  },
  {
    id: 'rec-043',
    referenceId: 'ref_RF99201',
    type: 'REFUND',
    source: 'Razorpay Gateway',
    amount: 5500,
    date: '2026-08-22',
    status: 'refunded',
    customerEmail: 'neha.r@startuphub.in',
    description: 'Refund triggered for pay_U2s09q44g'
  },
  {
    id: 'rec-044',
    referenceId: 'exp_AWS_202608',
    type: 'EXPENSE',
    source: 'ERP Expense Ledger',
    amount: 22400,
    date: '2026-08-20',
    status: 'settled',
    description: 'AWS Cloud Infrastructure Mumbai Region'
  },
  {
    id: 'rec-045',
    referenceId: 'exp_SLACK_202608',
    type: 'EXPENSE',
    source: 'ERP Expense Ledger',
    amount: 6800,
    date: '2026-08-18',
    status: 'settled',
    description: 'Slack Technologies Business+ 20 Seats'
  },
  {
    id: 'rec-046',
    referenceId: 'exp_GOOGLE_202608',
    type: 'EXPENSE',
    source: 'ERP Expense Ledger',
    amount: 9400,
    date: '2026-08-19',
    status: 'settled',
    description: 'Google Workspace Cloud Enterprise'
  },
  // Additional settlements and orders to bring total > 50
  {
    id: 'rec-047',
    referenceId: 'pay_EXT_501',
    type: 'PAYMENT',
    source: 'Razorpay Gateway',
    amount: 1999,
    date: '2026-08-26',
    status: 'captured',
    customerEmail: 'aditi.m@consultancy.in',
    description: 'Pro Trial Upgrade'
  },
  {
    id: 'rec-048',
    referenceId: 'pay_EXT_501',
    type: 'SETTLEMENT',
    source: 'Bank Settlement (HDFC)',
    amount: 1999,
    date: '2026-08-27',
    status: 'settled',
    customerEmail: 'aditi.m@consultancy.in',
    description: 'Bank credit match'
  },
  {
    id: 'rec-049',
    referenceId: 'pay_EXT_502',
    type: 'PAYMENT',
    source: 'Razorpay Gateway',
    amount: 4999,
    date: '2026-08-26',
    status: 'captured',
    customerEmail: 'siddharth.r@fintech.co',
    description: 'API Bundle 50k calls'
  },
  {
    id: 'rec-050',
    referenceId: 'pay_EXT_502',
    type: 'SETTLEMENT',
    source: 'Bank Settlement (HDFC)',
    amount: 4999,
    date: '2026-08-27',
    status: 'settled',
    customerEmail: 'siddharth.r@fintech.co',
    description: 'Bank credit match'
  },
  {
    id: 'rec-051',
    referenceId: 'pay_EXT_503',
    type: 'PAYMENT',
    source: 'Razorpay Gateway',
    amount: 13500,
    date: '2026-08-25',
    status: 'captured',
    customerEmail: 'tanya.b@designsystems.io',
    description: 'Design Token Engine Custom Tier'
  },
  {
    id: 'rec-052',
    referenceId: 'pay_EXT_503',
    type: 'SETTLEMENT',
    source: 'Bank Settlement (HDFC)',
    amount: 13500,
    date: '2026-08-26',
    status: 'settled',
    customerEmail: 'tanya.b@designsystems.io',
    description: 'Bank credit match'
  },
  {
    id: 'rec-053',
    referenceId: 'pay_EXT_504',
    type: 'PAYMENT',
    source: 'Razorpay Gateway',
    amount: 8800,
    date: '2026-08-25',
    status: 'captured',
    customerEmail: 'harsh.v@finscale.in',
    description: 'Batch Webhook Ingestion Service'
  },
  {
    id: 'rec-054',
    referenceId: 'pay_EXT_504',
    type: 'SETTLEMENT',
    source: 'Bank Settlement (HDFC)',
    amount: 8800,
    date: '2026-08-26',
    status: 'settled',
    customerEmail: 'harsh.v@finscale.in',
    description: 'Bank credit match'
  },
  {
    id: 'rec-055',
    referenceId: 'pay_EXT_505',
    type: 'PAYMENT',
    source: 'Razorpay Gateway',
    amount: 6200,
    date: '2026-08-26',
    status: 'captured',
    customerEmail: 'nisha.k@solopreneur.in',
    description: 'FINOVA OS Premium Team Seat'
  },
  {
    id: 'rec-056',
    referenceId: 'pay_EXT_505',
    type: 'SETTLEMENT',
    source: 'Bank Settlement (HDFC)',
    amount: 6200,
    date: '2026-08-27',
    status: 'settled',
    customerEmail: 'nisha.k@solopreneur.in',
    description: 'Bank credit match'
  }
]
