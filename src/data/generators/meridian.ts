import type { Client, Return, ReturnField, SourceDocument, MessageThread } from '../../types'

// ── Meridian Hospitality Group LLC ──────────────────────────────────────────
// A large, multi-location restaurant partnership, built to test navigability
// at scale (Challenge 09) rather than to showcase one specific AI-trust
// scenario the way the other 4 fleshed-out returns each do. ~280 fields,
// ~40 source documents, ~30 message threads spread across 6 partners, 5
// restaurant locations, and 12 vendors.
//
// Design choice: the bulk of these fields are generated from small templates
// below rather than hand-authored one-by-one — at this scale that's honestly
// how seed data like this gets produced, and hand-writing 280 unique
// narratives would mostly be repetitive filler. A deliberate set of ~12
// fields (search "HAND-CRAFTED" below) get real, specific edge-case detail —
// a guaranteed-payment conflict, a low-confidence estimate, a data-entry
// mismatch — so the scale test isn't just uniform noise; there's still
// something genuine to find when you search or filter for it.

export const MERIDIAN_CLIENT_ID = 'client-meridian-hospitality'
export const MERIDIAN_RETURN_ID = 'ret-meridian-hospitality-2025'

// djb2-style string hash, used only to derive stable pseudo-random-looking
// numbers from a field's own id — deterministic across every render/reload,
// unlike Math.random(), so the dataset never shifts under a screenshot diff.
function hashStr(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0
  // djb2's raw output correlates badly for strings sharing a long common
  // prefix and differing only in their last character or two — exactly the
  // shape of these seeds (e.g. "...line1a" vs "...line1b") — so nearby ids
  // land in nearby buckets instead of scattering. A MurmurHash3-style
  // avalanche finalizer decorrelates that before the modulo below.
  h = h >>> 0
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}
function seeded(seed: string): number {
  return (hashStr(seed) % 10000) / 10000
}
function fmt(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function randAmount(seed: string, min: number, max: number): number {
  return min + seeded(seed) * (max - min)
}
function money(seed: string, min: number, max: number): string {
  return fmt(randAmount(seed, min, max))
}
function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export const MERIDIAN_PARTNERS = [
  { name: 'R. Alvarez', role: 'Managing Partner', pct: 35 },
  { name: 'D. Whitfield', role: 'Partner', pct: 20 },
  { name: 'S. Okafor', role: 'Partner', pct: 15 },
  { name: 'L. Bianchi', role: 'Partner', pct: 12 },
  { name: 'M. Park', role: 'Partner', pct: 10 },
  { name: 'T. Nkemelu', role: 'Partner', pct: 8 },
]

export const MERIDIAN_LOCATIONS = ['Riverside', 'Downtown Crossing', 'Harbor View', 'Uptown', 'Lakeside']

export const MERIDIAN_VENDORS = [
  'Acme Foods Supply',
  'Coastal Seafood Distributors',
  'Bianchi Linen Service',
  'ProChef Equipment Repair',
  'Greenfield Produce Co.',
  'Summit Beverage Distributors',
  'Apex Waste Management',
  'Elite Security Systems',
  'Sunrise Bakery Wholesale',
  'Metro Pest Control',
  'Harborview Maintenance LLC',
  'Delgado Graphic Design',
]

const DEPRECIATION_ASSETS = [
  'Walk-in Cooler',
  'Commercial Range',
  'POS System',
  'Dining Furniture',
  'Leasehold Improvements',
  'Delivery Vehicle',
  'Exterior Signage',
  'HVAC Unit',
]

// A plain, bulk-generated field — no source/warnings/history beyond a single
// AI-extraction entry. Confidence and review state are derived from the
// field's own id so the distribution is stable but still varied: ~8% land in
// needs-review, ~12% are already verified, the rest sit at ai-extracted.
function genField(opts: {
  id: string
  formLine: string
  label: string
  value: string
  documentId: string
  page: number
  snippet: string
  transformationExplanation: string
}): ReturnField {
  const r = seeded(opts.id)
  const state = r < 0.08 ? 'needs-review' : r < 0.2 ? 'verified' : 'ai-extracted'
  const confidence = state === 'needs-review' ? 0.5 + r * 0.3 : 0.8 + r * 0.19
  return {
    id: opts.id,
    formLine: opts.formLine,
    label: opts.label,
    value: opts.value,
    state,
    source: { documentId: opts.documentId, page: opts.page, snippet: opts.snippet },
    transformationExplanation: opts.transformationExplanation,
    aiConfidence: Math.round(confidence * 100) / 100,
    aiReasoning:
      state === 'needs-review'
        ? 'Extracted automatically, but flagged for a preparer to double-check before it feeds into the final return.'
        : 'Clean, legible source document — extraction matches the printed figure exactly.',
    warnings:
      state === 'needs-review'
        ? [
            {
              id: `warn-${opts.id}`,
              severity: 'info' as const,
              message: 'Auto-flagged for review as part of routine large-return spot-checking, not a known problem.',
            },
          ]
        : [],
    editHistory: [
      {
        id: `edit-${opts.id}-1`,
        timestamp: '2026-06-20T09:00:00Z',
        actorType: 'ai',
        actorName: 'AI Extraction',
        previousValue: '',
        newValue: opts.value,
        note: 'Bulk-extracted during initial return build-out.',
      },
    ],
  }
}

function lockedCapitalField(opts: { id: string; formLine: string; label: string; value: string; documentId: string }): ReturnField {
  return {
    id: opts.id,
    formLine: opts.formLine,
    label: opts.label,
    value: opts.value,
    state: 'locked',
    source: { documentId: opts.documentId, page: 1, snippet: `Beginning capital account, carried forward from FY2024: ${opts.value}` },
    transformationExplanation: "Carried forward from last year's filed return. Locked — prior-year figures can't be edited this year.",
    aiConfidence: 0.99,
    aiReasoning: "Matches the firm's copy of the filed prior-year return exactly.",
    warnings: [],
    editHistory: [
      {
        id: `edit-${opts.id}-1`,
        timestamp: '2025-03-12T09:00:00Z',
        actorType: 'ai',
        actorName: 'AI Extraction',
        previousValue: '',
        newValue: opts.value,
        note: 'Carried forward from prior-year filed return; locked on import.',
      },
    ],
  }
}

// ── Document ids referenced by the generated fields below ──────────────────
// (the actual SourceDocument objects are built further down, in the same
// order, so every id used here has a matching document).
const DOC_TRIAL_BALANCE = 'doc-meridian-trial-balance'
const DOC_PAYROLL = 'doc-meridian-payroll-register'
const DOC_CAPITAL_LEDGER = 'doc-meridian-capital-ledger'
const docK1 = (partnerName: string) => `doc-meridian-k1-${slug(partnerName)}`
const docPos = (location: string) => `doc-meridian-pos-${slug(location)}`
const docBank = (location: string) => `doc-meridian-bankstatement-${slug(location)}`
const docFixedAssets = (location: string) => `doc-meridian-fixedassets-${slug(location)}`
const doc1099 = (vendor: string) => `doc-meridian-1099-${slug(vendor)}`

// ── Location-level numbers, computed first so partnership totals below can
// genuinely sum from them instead of being independently random ─────────────
const LOCATION_WEIGHTS = [0.28, 0.24, 0.2, 0.16, 0.12]
const TOTAL_REVENUE = 3_040_000
const TOTAL_FOOD_COST = 1_034_000
const TOTAL_LABOR_COST = 972_000

function splitByWeight(total: number, seedPrefix: string): number[] {
  const jittered = LOCATION_WEIGHTS.map((w, i) => w * (0.94 + seeded(`${seedPrefix}-jitter-${i}`) * 0.12))
  const jitterSum = jittered.reduce((a, b) => a + b, 0)
  const raw = jittered.map((w) => (total * w) / jitterSum)
  // Force an exact sum by folding all rounding drift into the last location.
  const rounded = raw.slice(0, -1).map((n) => Math.round(n * 100) / 100)
  const last = Math.round((total - rounded.reduce((a, b) => a + b, 0)) * 100) / 100
  return [...rounded, last]
}

const locationRevenue = splitByWeight(TOTAL_REVENUE, 'revenue')
const locationFoodCost = splitByWeight(TOTAL_FOOD_COST, 'foodcost')
const locationLabor = splitByWeight(TOTAL_LABOR_COST, 'labor')

// Depreciation: 8 assets per location, current-year MACRS deduction each.
// Computed before Form 1065 Line 16 so that line is a genuine sum, not a
// separately-guessed number.
const depreciationByLocation = MERIDIAN_LOCATIONS.map((location) =>
  DEPRECIATION_ASSETS.map((asset) => randAmount(`depr-${slug(location)}-${slug(asset)}`, 400, 9500)),
)
const TOTAL_DEPRECIATION = depreciationByLocation.flat().reduce((a, b) => a + b, 0)

// Guaranteed payments per partner — feeds both each partner's own K-1 Box 4
// and the two partnership-level lines (Form 1065 Line 10, Schedule K Line 4a)
// that report the same total.
const guaranteedPaymentByPartner = MERIDIAN_PARTNERS.map((p) => randAmount(`gp-${slug(p.name)}`, 6000, 34000))
const TOTAL_GUARANTEED_PAYMENTS = guaranteedPaymentByPartner.reduce((a, b) => a + b, 0)

const locationRent = MERIDIAN_LOCATIONS.map((l) => randAmount(`rent-${slug(l)}`, 42000, 96000))
const TOTAL_RENT = locationRent.reduce((a, b) => a + b, 0)

// ── Per-location P&L (8 lines × 5 locations = 40 fields) ────────────────────
const locationPLFields: ReturnField[] = MERIDIAN_LOCATIONS.flatMap((location, i) => {
  const s = slug(location)
  const utilities = randAmount(`util-${s}`, 9000, 22000)
  const marketing = randAmount(`mkt-${s}`, 3000, 14000)
  const otherOpex = randAmount(`opex-${s}`, 4000, 16000)
  const netIncome = locationRevenue[i] - locationFoodCost[i] - locationLabor[i] - locationRent[i] - utilities - marketing - otherOpex

  return [
    genField({
      id: `field-meridian-pl-${s}-revenue`,
      formLine: `Location P&L — ${location}, Line 1`,
      label: 'Gross food & beverage revenue',
      value: fmt(locationRevenue[i]),
      documentId: docPos(location),
      page: 1,
      snippet: `Net sales, FY2025 annual total: ${fmt(locationRevenue[i])}`,
      transformationExplanation: `Summed from the ${location} location's POS system annual sales export.`,
    }),
    genField({
      id: `field-meridian-pl-${s}-foodcost`,
      formLine: `Location P&L — ${location}, Line 2`,
      label: 'Cost of food & beverage sold',
      value: fmt(locationFoodCost[i]),
      documentId: docBank(location),
      page: 1,
      snippet: `Food & beverage purchases, FY2025 total: ${fmt(locationFoodCost[i])}`,
      transformationExplanation: `Summed from vendor payments tagged as food/beverage cost on the ${location} operating account.`,
    }),
    genField({
      id: `field-meridian-pl-${s}-labor`,
      formLine: `Location P&L — ${location}, Line 3`,
      label: 'Labor cost',
      value: fmt(locationLabor[i]),
      documentId: DOC_PAYROLL,
      page: i + 1,
      snippet: `${location} — total wages & payroll tax, FY2025: ${fmt(locationLabor[i])}`,
      transformationExplanation: `Pulled from the ${location} section of the consolidated payroll register.`,
    }),
    genField({
      id: `field-meridian-pl-${s}-rent`,
      formLine: `Location P&L — ${location}, Line 4`,
      label: 'Rent expense',
      value: fmt(locationRent[i]),
      documentId: docBank(location),
      page: 2,
      snippet: `Monthly lease payments × 12, FY2025 total: ${fmt(locationRent[i])}`,
      transformationExplanation: `Summed 12 monthly lease payments from the ${location} operating account.`,
    }),
    genField({
      id: `field-meridian-pl-${s}-utilities`,
      formLine: `Location P&L — ${location}, Line 5`,
      label: 'Utilities expense',
      value: fmt(utilities),
      documentId: docBank(location),
      page: 2,
      snippet: `Electric, gas, water, FY2025 total: ${fmt(utilities)}`,
      transformationExplanation: `Summed utility payments from the ${location} operating account.`,
    }),
    genField({
      id: `field-meridian-pl-${s}-marketing`,
      formLine: `Location P&L — ${location}, Line 6`,
      label: 'Marketing expense',
      value: fmt(marketing),
      documentId: docBank(location),
      page: 3,
      snippet: `Local marketing & advertising, FY2025 total: ${fmt(marketing)}`,
      transformationExplanation: `Summed marketing-tagged payments from the ${location} operating account.`,
    }),
    genField({
      id: `field-meridian-pl-${s}-otheropex`,
      formLine: `Location P&L — ${location}, Line 7`,
      label: 'Other operating expenses',
      value: fmt(otherOpex),
      documentId: docBank(location),
      page: 3,
      snippet: `Miscellaneous operating costs, FY2025 total: ${fmt(otherOpex)}`,
      transformationExplanation: `Summed remaining uncategorized operating payments from the ${location} account.`,
    }),
    {
      ...genField({
        id: `field-meridian-pl-${s}-netincome`,
        formLine: `Location P&L — ${location}, Line 8`,
        label: 'Location net income',
        value: fmt(netIncome),
        documentId: docPos(location),
        page: 2,
        snippet: `Computed: revenue less all location operating expenses.`,
        transformationExplanation: `Revenue minus food cost, labor, rent, utilities, marketing, and other opex for ${location}.`,
      }),
      state: 'verified' as const,
    },
  ]
})

// ── Per-location depreciation (8 assets × 5 locations = 40 fields) ─────────
const depreciationFields: ReturnField[] = MERIDIAN_LOCATIONS.flatMap((location, li) => {
  const s = slug(location)
  return DEPRECIATION_ASSETS.map((asset, ai) =>
    genField({
      id: `field-meridian-depr-${s}-${slug(asset)}`,
      formLine: `Form 4562, ${location} Location, Line ${ai + 1}`,
      label: `${asset} — current-year depreciation`,
      value: fmt(depreciationByLocation[li][ai]),
      documentId: docFixedAssets(location),
      page: ai + 1,
      snippet: `${asset} — current-year MACRS deduction: ${fmt(depreciationByLocation[li][ai])}`,
      transformationExplanation: `Pulled from the ${location} fixed-asset and depreciation schedule.`,
    }),
  )
})

// ── Form 1065, page 1 — Income & Deductions (22 fields) ─────────────────────
const grossReceipts = TOTAL_REVENUE
const returnsAllowances = randAmount('1065-returns-allowances', 9000, 17000)
const netReceipts = grossReceipts - returnsAllowances
const cogs = TOTAL_FOOD_COST
const grossProfit = netReceipts - cogs
const otherIncome1065 = randAmount('1065-other-income', 8000, 26000)
const totalIncome1065 = grossProfit + otherIncome1065

const repairs = randAmount('1065-repairs', 18000, 42000)
const badDebts = randAmount('1065-baddebts', 0, 6000)
const taxesLicenses = randAmount('1065-taxes-licenses', 28000, 58000)
const interestExpense = randAmount('1065-interest-expense', 12000, 34000)
const retirementPlans = randAmount('1065-retirement', 6000, 18000)
const employeeBenefits = randAmount('1065-benefits', 15000, 38000)
const otherDeductions1065 = randAmount('1065-other-deductions', 20000, 52000)

const totalDeductions1065 =
  TOTAL_LABOR_COST +
  TOTAL_GUARANTEED_PAYMENTS +
  repairs +
  badDebts +
  TOTAL_RENT +
  taxesLicenses +
  interestExpense +
  TOTAL_DEPRECIATION +
  retirementPlans +
  employeeBenefits +
  otherDeductions1065

const ordinaryBusinessIncome = totalIncome1065 - totalDeductions1065

const form1065Fields: ReturnField[] = [
  ['1a', 'Gross receipts or sales', grossReceipts, 'Summed from all 5 locations\' POS annual sales exports.'],
  ['1b', 'Returns and allowances', returnsAllowances, 'Summed comp/void/refund totals across all 5 POS systems.'],
  ['1c', 'Balance (net receipts)', netReceipts, 'Line 1a minus Line 1b.'],
  ['2', 'Cost of goods sold', cogs, 'Summed food & beverage cost of goods sold across all 5 locations.'],
  ['3', 'Gross profit', grossProfit, 'Line 1c minus Line 2.'],
  ['4', 'Ordinary income from other partnerships', randAmount('1065-4', 0, 4000), 'Pass-through income from a minor equipment-leasing partnership interest.'],
  ['5', 'Net farm profit', 0, 'Not applicable — no farm income this partnership.'],
  ['6', 'Net gain from Form 4797', randAmount('1065-6', 0, 3000), 'Gain on disposal of retired kitchen equipment, from Form 4797.'],
  ['7', 'Other income', otherIncome1065, 'Catering fees and gift-card breakage income across all locations.'],
  ['8', 'Total income (loss)', totalIncome1065, 'Sum of Lines 3 through 7.'],
  ['9', 'Salaries and wages', TOTAL_LABOR_COST, 'Summed from the consolidated payroll register across all 5 locations.'],
  ['10', 'Guaranteed payments to partners', TOTAL_GUARANTEED_PAYMENTS, "Summed from each partner's guaranteed payment agreement."],
  ['11', 'Repairs and maintenance', repairs, 'Summed repair and maintenance invoices across all locations.'],
  ['12', 'Bad debts', badDebts, 'Written-off catering invoices deemed uncollectible.'],
  ['13', 'Rent', TOTAL_RENT, 'Summed 12 months of lease payments across all 5 locations.'],
  ['14', 'Taxes and licenses', taxesLicenses, 'Summed payroll tax, sales tax remittance, and local business licenses.'],
  ['15', 'Interest expense', interestExpense, 'Summed interest on the equipment financing notes and revolving line of credit.'],
  ['16', 'Depreciation (Form 4562)', TOTAL_DEPRECIATION, 'Summed current-year depreciation across all 40 fixed assets (Form 4562).'],
  ['17', 'Depletion', 0, 'Not applicable — no depletable assets.'],
  ['18', 'Retirement plans, etc.', retirementPlans, "Summed employer contributions to the partnership's 401(k) plan."],
  ['19', 'Employee benefit programs', employeeBenefits, 'Summed health insurance premiums paid on behalf of employees.'],
  ['20', 'Other deductions', otherDeductions1065, 'Summed remaining uncategorized operating deductions (see attached statement).'],
].map(([lineNo, label, value, explanation]) =>
  genField({
    id: `field-meridian-1065-line${lineNo}`,
    formLine: `Form 1065, Line ${lineNo}`,
    label: label as string,
    value: fmt(value as number),
    documentId: DOC_TRIAL_BALANCE,
    page: 1,
    snippet: `${label} — FY2025: ${fmt(value as number)}`,
    transformationExplanation: explanation as string,
  }),
)
form1065Fields.push({
  ...genField({
    id: 'field-meridian-1065-line21',
    formLine: 'Form 1065, Line 21',
    label: 'Total deductions',
    value: fmt(totalDeductions1065),
    documentId: DOC_TRIAL_BALANCE,
    page: 1,
    snippet: `Total deductions — FY2025: ${fmt(totalDeductions1065)}`,
    transformationExplanation: 'Sum of Lines 9 through 20.',
  }),
  state: 'verified',
})
form1065Fields.push({
  ...genField({
    id: 'field-meridian-1065-line22',
    formLine: 'Form 1065, Line 22',
    label: 'Ordinary business income (loss)',
    value: fmt(ordinaryBusinessIncome),
    documentId: DOC_TRIAL_BALANCE,
    page: 1,
    snippet: `Ordinary business income — FY2025: ${fmt(ordinaryBusinessIncome)}`,
    transformationExplanation: 'Line 8 (total income) minus Line 21 (total deductions).',
  }),
  state: 'verified',
})

// ── Schedule K — partnership-level distributive share items (17 fields) ────
const netRentalRE = 0
const otherNetRental = 0
const interestIncomeK = randAmount('schk-interest', 3000, 9000)
const dividendsK = randAmount('schk-dividends', 500, 3000)
const royaltiesK = 0
const stcgK = randAmount('schk-stcg', 0, 6000)
const ltcgK = randAmount('schk-ltcg', 0, 12000)
const sec1231K = randAmount('schk-1231', 0, 5000)
const otherIncomeK = randAmount('schk-otherincome', 0, 4000)
const sec179DedK = randAmount('schk-sec179', 8000, 24000)
const charitableK = randAmount('schk-charitable', 2000, 9000)
const otherDeductionsK = randAmount('schk-otherded', 3000, 11000)

const scheduleKFields: ReturnField[] = [
  ['1', 'Ordinary business income (loss)', ordinaryBusinessIncome, 'Carried from Form 1065, Line 22.'],
  ['2', 'Net rental real estate income (loss)', netRentalRE, 'Not applicable — the partnership owns no rental real estate.'],
  ['3a', 'Other gross rental income', otherNetRental, 'Not applicable — no other rental activity.'],
  ['4a', 'Guaranteed payments for services', TOTAL_GUARANTEED_PAYMENTS, "Carried from Form 1065, Line 10 — each partner's guaranteed payment agreement."],
  ['5', 'Interest income', interestIncomeK, 'Interest earned on the 5 location operating accounts.'],
  ['6a', 'Ordinary dividends', dividendsK, "Dividends from the partnership's short-term investment account."],
  ['7', 'Royalties', royaltiesK, 'Not applicable — no royalty income.'],
  ['8', 'Net short-term capital gain (loss)', stcgK, 'Gain on sale of short-term investment holdings.'],
  ['9a', 'Net long-term capital gain (loss)', ltcgK, 'Gain on sale of long-term investment holdings.'],
  ['10', 'Net section 1231 gain (loss)', sec1231K, 'Gain on disposal of retired kitchen equipment (Form 4797).'],
  ['11', 'Other income (loss)', otherIncomeK, 'Miscellaneous vendor rebates and insurance recoveries.'],
  ['12', 'Section 179 deduction', sec179DedK, 'Elected Section 179 expensing on qualifying new equipment purchases.'],
  ['13a', 'Charitable contributions', charitableK, 'Summed donations to local food-bank and community programs.'],
  ['13d', 'Other deductions', otherDeductionsK, 'Investment-related and other miscellaneous deductions (see attached statement).'],
].map(([lineNo, label, value, explanation]) =>
  genField({
    id: `field-meridian-schk-line${lineNo}`,
    formLine: `Form 1065, Schedule K, Line ${lineNo}`,
    label: label as string,
    value: fmt(value as number),
    documentId: DOC_TRIAL_BALANCE,
    page: 2,
    snippet: `${label} — FY2025: ${fmt(value as number)}`,
    transformationExplanation: explanation as string,
  }),
)

// ── Schedule L — Balance Sheet, beginning & ending columns (32 fields) ──────
function buildBalanceSheetColumn(seedPrefix: string) {
  const cash = randAmount(`${seedPrefix}-cash`, 180000, 340000)
  const ar = randAmount(`${seedPrefix}-ar`, 20000, 60000)
  const inventory = randAmount(`${seedPrefix}-inventory`, 60000, 140000)
  const prepaid = randAmount(`${seedPrefix}-prepaid`, 8000, 24000)
  const otherCurrentAssets = randAmount(`${seedPrefix}-othercurrentassets`, 5000, 18000)
  const buildingsEquipment = randAmount(`${seedPrefix}-buildings`, 900000, 1400000)
  const accumDepreciation = -randAmount(`${seedPrefix}-accumdep`, 220000, 480000)
  const land = randAmount(`${seedPrefix}-land`, 0, 250000)
  const otherAssets = randAmount(`${seedPrefix}-otherassets`, 10000, 30000)
  const totalAssets = cash + ar + inventory + prepaid + otherCurrentAssets + buildingsEquipment + accumDepreciation + land + otherAssets

  const ap = randAmount(`${seedPrefix}-ap`, 40000, 95000)
  const otherCurrentLiab = randAmount(`${seedPrefix}-othercurrentliab`, 15000, 45000)
  const mortgages = randAmount(`${seedPrefix}-mortgages`, 300000, 620000)
  const otherLiab = randAmount(`${seedPrefix}-otherliab`, 10000, 30000)
  const partnersCapital = totalAssets - (ap + otherCurrentLiab + mortgages + otherLiab)

  return {
    cash, ar, inventory, prepaid, otherCurrentAssets, buildingsEquipment, accumDepreciation, land, otherAssets, totalAssets,
    ap, otherCurrentLiab, mortgages, otherLiab, partnersCapital,
  }
}

const balanceSheetBeginning = buildBalanceSheetColumn('schl-beg')
const balanceSheetEnding = buildBalanceSheetColumn('schl-end')

function balanceSheetFields(col: ReturnType<typeof buildBalanceSheetColumn>, columnLabel: 'Beginning' | 'Ending', idSuffix: string): ReturnField[] {
  const rows: [string, string, number][] = [
    ['1', 'Cash', col.cash],
    ['2', 'Accounts receivable', col.ar],
    ['3', 'Inventory', col.inventory],
    ['4', 'Prepaid expenses', col.prepaid],
    ['5', 'Other current assets', col.otherCurrentAssets],
    ['6', 'Buildings and other depreciable assets', col.buildingsEquipment],
    ['7', 'Less: accumulated depreciation', col.accumDepreciation],
    ['8', 'Land', col.land],
    ['9', 'Other assets', col.otherAssets],
    ['10', 'Total assets', col.totalAssets],
    ['11', 'Accounts payable', col.ap],
    ['12', 'Other current liabilities', col.otherCurrentLiab],
    ['13', 'Mortgages, notes payable (long-term)', col.mortgages],
    ['14', 'Other liabilities', col.otherLiab],
    ['15', "Partners' capital accounts", col.partnersCapital],
    ['16', 'Total liabilities and capital', col.totalAssets],
  ]
  return rows.map(([lineNo, label, value]) =>
    genField({
      id: `field-meridian-schl-${idSuffix}-line${lineNo}`,
      formLine: `Form 1065, Schedule L (${columnLabel}), Line ${lineNo}`,
      label,
      value: fmt(value),
      documentId: DOC_TRIAL_BALANCE,
      page: 3,
      snippet: `${columnLabel} balance — ${label}: ${fmt(value)}`,
      transformationExplanation: `Pulled from the ${columnLabel.toLowerCase()}-of-year trial balance.`,
    }),
  )
}

const scheduleLFields: ReturnField[] = [
  ...balanceSheetFields(balanceSheetBeginning, 'Beginning', 'beg'),
  ...balanceSheetFields(balanceSheetEnding, 'Ending', 'end'),
]

// ── Schedule M-1 — Reconciliation of Income (8 fields) ──────────────────────
const bookTaxTimingDiff = randAmount('m1-timingdiff', 2000, 9000)
const netIncomePerBooks = ordinaryBusinessIncome - TOTAL_GUARANTEED_PAYMENTS - bookTaxTimingDiff
const m1Subtotal = netIncomePerBooks + 0 + TOTAL_GUARANTEED_PAYMENTS + bookTaxTimingDiff

const scheduleM1Fields: ReturnField[] = [
  ['1', 'Net income (loss) per books', netIncomePerBooks, "Pulled from the partnership's internal financial statements."],
  ['2', 'Income included on Schedule K, not recorded on books', 0, 'None this year.'],
  ['3', 'Guaranteed payments (not deducted on books)', TOTAL_GUARANTEED_PAYMENTS, 'Added back — guaranteed payments are deducted for book purposes but reported separately on Schedule K.'],
  ['4', 'Expenses recorded on books, not on Schedule K', bookTaxTimingDiff, 'Meals & entertainment (50% disallowed) and minor book/tax depreciation timing differences.'],
  ['5', 'Add lines 1 through 4', m1Subtotal, 'Sum of Lines 1–4.'],
  ['6', 'Income on Schedule K, not recorded on books (e.g. tax-exempt interest)', 0, 'None this year.'],
  ['7', 'Deductions on Schedule K, not charged against book income', 0, 'None this year.'],
  ['8', 'Total income (Schedule K, Line 1)', m1Subtotal, 'Line 5 minus Lines 6 and 7 — must match Schedule K, Line 1.'],
].map(([lineNo, label, value, explanation]) =>
  genField({
    id: `field-meridian-m1-line${lineNo}`,
    formLine: `Form 1065, Schedule M-1, Line ${lineNo}`,
    label: label as string,
    value: fmt(value as number),
    documentId: DOC_TRIAL_BALANCE,
    page: 4,
    snippet: `${label} — FY2025: ${fmt(value as number)}`,
    transformationExplanation: explanation as string,
  }),
)

// ── Schedule M-2 — Analysis of Partners' Capital Accounts (7 fields) ───────
const TOTAL_DISTRIBUTIONS = randAmount('total-distributions', 380000, 460000)
const m2CapitalContributed = randAmount('m2-contributed', 0, 40000)
const m2BeginningCapital = balanceSheetBeginning.partnersCapital
const m2EndingCapital = m2BeginningCapital + m2CapitalContributed + netIncomePerBooks - TOTAL_DISTRIBUTIONS

const scheduleM2Fields: ReturnField[] = [
  ['1', 'Beginning capital account', m2BeginningCapital, "Carried forward from last year's filed Schedule L, ending balance."],
  ['2', 'Capital contributed during the year', m2CapitalContributed, 'Additional cash contributions from partners during FY2025.'],
  ['3', 'Net income (loss) per books', netIncomePerBooks, 'Carried from Schedule M-1, Line 1.'],
  ['4', 'Other increases', 0, 'None this year.'],
  ['5', 'Distributions', TOTAL_DISTRIBUTIONS, 'Summed cash distributions to all 6 partners during FY2025.'],
  ['6', 'Other decreases', 0, 'None this year.'],
  ['7', 'Ending capital account', m2EndingCapital, 'Lines 1 + 2 + 3 + 4 minus Lines 5 and 6 — should match Schedule L, Line 15 (ending column).'],
].map(([lineNo, label, value, explanation]) =>
  genField({
    id: `field-meridian-m2-line${lineNo}`,
    formLine: `Form 1065, Schedule M-2, Line ${lineNo}`,
    label: label as string,
    value: fmt(value as number),
    documentId: DOC_CAPITAL_LEDGER,
    page: 1,
    snippet: `${label} — FY2025: ${fmt(value as number)}`,
    transformationExplanation: explanation as string,
  }),
)

// Splits a partnership-level total across all 6 partners by ownership
// percentage (which sum to exactly 100), folding cent-level rounding drift
// into the last partner so every split still sums back to the total exactly.
function splitByPct(total: number): number[] {
  const raw = MERIDIAN_PARTNERS.map((p) => (total * p.pct) / 100)
  const rounded = raw.slice(0, -1).map((n) => Math.round(n * 100) / 100)
  const last = Math.round((total - rounded.reduce((a, b) => a + b, 0)) * 100) / 100
  return [...rounded, last]
}

const ordinaryIncomeByPartner = splitByPct(ordinaryBusinessIncome)
const interestByPartner = splitByPct(interestIncomeK)
const dividendsByPartner = splitByPct(dividendsK)
const stcgByPartner = splitByPct(stcgK)
const ltcgByPartner = splitByPct(ltcgK)
const sec1231ByPartner = splitByPct(sec1231K)
const otherIncomeByPartner = splitByPct(otherIncomeK)
const sec179ByPartner = splitByPct(sec179DedK)
const otherDeductionsByPartner = splitByPct(otherDeductionsK)
const distributionsByPartner = splitByPct(TOTAL_DISTRIBUTIONS)

// ── Per-partner Schedule K-1 boxes (14 boxes × 6 partners = 84 fields) ──────
const k1Fields: ReturnField[] = MERIDIAN_PARTNERS.flatMap((partner, i) => {
  const s = slug(partner.name)
  const boxes: [string, string, number, string][] = [
    ['1', 'Ordinary business income (loss)', ordinaryIncomeByPartner[i], `Allocated at ${partner.pct}% ownership from Schedule K, Line 1.`],
    ['2', 'Net rental real estate income (loss)', 0, 'Not applicable — the partnership owns no rental real estate.'],
    ['3', 'Other net rental income (loss)', 0, 'Not applicable — no other rental activity.'],
    ['4', 'Guaranteed payments', guaranteedPaymentByPartner[i], `Per ${partner.name}'s guaranteed payment agreement with the partnership.`],
    ['5', 'Interest income', interestByPartner[i], `Allocated at ${partner.pct}% ownership from Schedule K, Line 5.`],
    ['6', 'Ordinary dividends', dividendsByPartner[i], `Allocated at ${partner.pct}% ownership from Schedule K, Line 6a.`],
    ['7', 'Royalties', 0, 'Not applicable — no royalty income.'],
    ['8', 'Net short-term capital gain (loss)', stcgByPartner[i], `Allocated at ${partner.pct}% ownership from Schedule K, Line 8.`],
    ['9', 'Net long-term capital gain (loss)', ltcgByPartner[i], `Allocated at ${partner.pct}% ownership from Schedule K, Line 9a.`],
    ['10', 'Net section 1231 gain (loss)', sec1231ByPartner[i], `Allocated at ${partner.pct}% ownership from Schedule K, Line 10.`],
    ['11', 'Other income (loss)', otherIncomeByPartner[i], `Allocated at ${partner.pct}% ownership from Schedule K, Line 11.`],
    ['12', 'Section 179 deduction', sec179ByPartner[i], `Allocated at ${partner.pct}% ownership from Schedule K, Line 12.`],
    ['13', 'Other deductions', otherDeductionsByPartner[i], `Allocated at ${partner.pct}% ownership from Schedule K, Line 13d.`],
    ['14', 'Distributions', distributionsByPartner[i], `Cash distributions paid to ${partner.name} during FY2025.`],
  ]
  return boxes.map(([boxNo, label, value, explanation]) =>
    genField({
      id: `field-meridian-k1-${s}-box${boxNo}`,
      formLine: `Schedule K-1 (1065), Partner ${i + 1} — ${partner.name}, Box ${boxNo}`,
      label,
      value: fmt(value),
      documentId: docK1(partner.name),
      page: 1,
      snippet: `Box ${boxNo} — ${label}: ${fmt(value)}`,
      transformationExplanation: explanation,
    }),
  )
})

// ── Per-partner capital account rollforward (3 fields × 6 partners = 18) ────
const partnerBeginningCapital = splitByPct(m2BeginningCapital)
const partnerContributed = MERIDIAN_PARTNERS.map((p) => randAmount(`capcontrib-${slug(p.name)}`, 0, 8000))
const capitalFields: ReturnField[] = MERIDIAN_PARTNERS.flatMap((partner, i) => {
  const s = slug(partner.name)
  const ending = partnerBeginningCapital[i] + partnerContributed[i] + ordinaryIncomeByPartner[i] - distributionsByPartner[i]
  return [
    lockedCapitalField({
      id: `field-meridian-capital-${s}-beginning`,
      formLine: `Schedule M-2, Partner ${i + 1} — ${partner.name}, Line 1`,
      label: 'Beginning capital account',
      value: fmt(partnerBeginningCapital[i]),
      documentId: DOC_CAPITAL_LEDGER,
    }),
    genField({
      id: `field-meridian-capital-${s}-contributed`,
      formLine: `Schedule M-2, Partner ${i + 1} — ${partner.name}, Line 2`,
      label: 'Capital contributed this year',
      value: fmt(partnerContributed[i]),
      documentId: DOC_CAPITAL_LEDGER,
      page: 2,
      snippet: `${partner.name} — capital contributed FY2025: ${fmt(partnerContributed[i])}`,
      transformationExplanation: `Pulled from the partner capital-account ledger for ${partner.name}.`,
    }),
    {
      ...genField({
        id: `field-meridian-capital-${s}-ending`,
        formLine: `Schedule M-2, Partner ${i + 1} — ${partner.name}, Line 3`,
        label: 'Ending capital account',
        value: fmt(ending),
        documentId: DOC_CAPITAL_LEDGER,
        page: 2,
        snippet: `${partner.name} — ending capital account FY2025: ${fmt(ending)}`,
        transformationExplanation: 'Beginning capital, plus contributions and allocated income, minus distributions.',
      }),
      state: 'verified' as const,
    },
  ]
})

// ── Vendor 1099-NEC summary (12 fields) ─────────────────────────────────────
const vendorFields: ReturnField[] = MERIDIAN_VENDORS.map((vendor, i) =>
  genField({
    id: `field-meridian-1099-${slug(vendor)}`,
    formLine: `Vendor 1099 Summary, Line ${i + 1}`,
    label: `${vendor} — total payments`,
    value: money(`vendor-${slug(vendor)}`, 4000, 68000),
    documentId: doc1099(vendor),
    page: 1,
    snippet: `Box 1 — Nonemployee compensation: ${money(`vendor-${slug(vendor)}`, 4000, 68000)}`,
    transformationExplanation: `Copied from the 1099-NEC issued to ${vendor} for FY2025.`,
  }),
)

// ── Assembly, in the order they should appear ───────────────────────────────
const allMeridianFields: ReturnField[] = [
  ...form1065Fields,
  ...scheduleKFields,
  ...scheduleLFields,
  ...scheduleM1Fields,
  ...scheduleM2Fields,
  ...k1Fields,
  ...capitalFields,
  ...locationPLFields,
  ...depreciationFields,
  ...vendorFields,
]

// ── HAND-CRAFTED: ~12 fields with real, specific edge-case detail, layered on
// top of the generated bulk above by id so the scale test has genuine things
// to find via search/filter, not just uniform templated noise. ─────────────
const HAND_CRAFTED_OVERRIDES: Record<string, Partial<ReturnField>> = {
  // 1. A guaranteed-payment conflict — the same shape as Marcus Webb's
  // 1099-INT conflict, at scale: an original agreement vs. a mid-year
  // amendment, not silently resolved.
  'field-meridian-k1-d-whitfield-box4': {
    state: 'needs-review',
    aiConfidence: 0.52,
    aiReasoning:
      "D. Whitfield's original guaranteed-payment agreement specifies $18,000/year, but a signed amendment effective July 1 raises it to $26,000/year. I prorated to $22,000 (6 months at each rate), but haven't confirmed the amendment was actually adopted by partner vote as the operating agreement requires — flagging rather than assuming the amendment is valid.",
    warnings: [
      {
        id: 'warn-meridian-whitfield-gp',
        severity: 'critical',
        message:
          'Two guaranteed-payment agreements on file for D. Whitfield with different amounts. Confirm the amendment was properly adopted before relying on the prorated figure.',
      },
    ],
  },
  // 2. Low-confidence extraction from a damaged source — Dana Ruiz's mileage
  // photo, recreated at asset-schedule scale.
  'field-meridian-depr-harbor-view-pos-system': {
    state: 'needs-review',
    aiConfidence: 0.34,
    aiReasoning:
      "The Harbor View fixed-asset invoice for the POS system was submitted as a phone photo with heavy glare across the total line. I can read the unit count and a partial price, and estimated the total depreciable basis from those — this is a low-confidence estimate because the source is hard to read, not because anything looks wrong with the purchase itself.",
    warnings: [
      {
        id: 'warn-meridian-harborview-pos',
        severity: 'warning',
        message: 'Source invoice photo has glare obscuring the total. Ask the client for a clearer copy or the vendor receipt before relying on this basis.',
      },
    ],
  },
  // 3. A missing-data gap serious enough to block filing — a POS outage, not
  // an extraction problem.
  'field-meridian-pl-uptown-revenue': {
    state: 'needs-review',
    aiReasoning:
      "Uptown's POS system was offline for 3 days in September after a payment-processor outage; sales during that window were logged manually on paper tickets that haven't been entered into the system yet. This total is the POS export only and is understated until those 3 days are added.",
    warnings: [
      {
        id: 'warn-meridian-uptown-outage',
        severity: 'critical',
        message: '3 days of manually-logged sales (Sept POS outage) are not yet reflected in this total. Confirm with the Uptown manager before filing.',
      },
    ],
  },
  // 4. The traceability-check mismatch, recreated at scale — a realistic
  // data-entry slip that a plain text match catches even on a "verified"
  // field, the same way Dana Ruiz's supplies expense did.
  'field-meridian-1099-coastal-seafood-distributors': {
    value: '52,940.00',
    state: 'verified',
    aiConfidence: 0.91,
    source: { documentId: 'doc-meridian-1099-coastal-seafood-distributors', page: 1, snippet: 'Box 1 — Nonemployee compensation: 52,490.00' },
    editHistory: [
      {
        id: 'edit-meridian-coastal-seafood-1',
        timestamp: '2026-06-20T09:00:00Z',
        actorType: 'ai',
        actorName: 'AI Extraction',
        previousValue: '',
        newValue: '52,940.00',
        note: 'Bulk-extracted during initial return build-out.',
      },
      {
        id: 'edit-meridian-coastal-seafood-2',
        timestamp: '2026-07-02T13:40:00Z',
        actorType: 'preparer',
        actorName: 'Alicia Kim',
        previousValue: '52,940.00',
        newValue: '52,940.00',
        note: 'Cross-checked against the AP ledger; confirmed.',
      },
    ],
  },
  // 5. An aggregate limitation question at the partnership level, not a
  // single-document extraction issue.
  'field-meridian-schk-line12': {
    state: 'needs-review',
    aiReasoning:
      "Total Section 179 elections across all 5 locations' fixed-asset schedules add up to this figure, but Section 179 is capped at the partnership's total ordinary business income for the year — this hasn't been checked against that limitation yet.",
    warnings: [
      {
        id: 'warn-meridian-sec179-limit',
        severity: 'warning',
        message: "Confirm this doesn't exceed the partnership's Section 179 business-income limitation before filing.",
      },
    ],
  },
  // 6. A specific partner's capital account not reconciling with an
  // independent draft.
  'field-meridian-capital-t-nkemelu-ending': {
    state: 'needs-review',
    aiReasoning:
      "This computed ending balance is $340 off from the ending balance on T. Nkemelu's separately-prepared draft K-1 from last year's software — likely a rounding difference from how the prior preparer allocated Section 179 to this partner, but not yet confirmed.",
    warnings: [
      {
        id: 'warn-meridian-nkemelu-capital',
        severity: 'info',
        message: '$340 discrepancy vs. an independent prior-year draft. Likely a rounding difference — confirm before finalizing.',
      },
    ],
  },
  // 7. A genuinely client-provided figure with no source document, the same
  // pattern as Sarah Chen's estimated tax payments.
  'field-meridian-1065-line4': {
    state: 'client-provided',
    source: undefined,
    aiConfidence: undefined,
    aiReasoning: undefined,
    transformationExplanation:
      "R. Alvarez reported this directly — it's the partnership's minor pass-through share of income from a separate equipment-leasing partnership it holds an interest in, and no K-1 for that entity had arrived yet as of filing prep.",
    warnings: [
      {
        id: 'warn-meridian-1065-line4',
        severity: 'info',
        message: "Entered by the client from memory — replace with the actual figure once that partnership's K-1 arrives.",
      },
    ],
    editHistory: [
      {
        id: 'edit-meridian-1065-line4-1',
        timestamp: '2026-07-01T10:00:00Z',
        actorType: 'client',
        actorName: 'R. Alvarez',
        previousValue: '',
        newValue: '2,400.00',
        note: 'Entered via client portal — exact K-1 from the other partnership not yet received.',
      },
    ],
  },
  // 8. A vendor dispute — the field this one is about is tied to a
  // client-visible thread (see meridianThreads below).
  'field-meridian-1099-apex-waste-management': {
    state: 'needs-review',
    aiReasoning:
      "Apex Waste Management disputes the total on our AP ledger, claiming a service credit was never applied. Using our internal total pending the client's response.",
    warnings: [
      {
        id: 'warn-meridian-apex-dispute',
        severity: 'warning',
        message: 'Vendor disputes this total. Confirm with the client before filing the 1099 summary.',
      },
    ],
  },
  // 9. A mid-year asset disposal complicating a straightforward depreciation
  // line.
  'field-meridian-depr-lakeside-delivery-vehicle': {
    state: 'needs-review',
    aiReasoning:
      'This vehicle was sold in August, partway through the year. The figure here is a full-year depreciation estimate — it needs to be prorated to the actual disposal date and paired with a gain/loss calculation on Form 4797, neither of which has been done yet.',
    warnings: [
      {
        id: 'warn-meridian-lakeside-vehicle',
        severity: 'warning',
        message: 'Vehicle was disposed of mid-year. Prorate depreciation to the sale date and confirm Form 4797 gain/loss before filing.',
      },
    ],
  },
  // 10. A miscoded labor entry.
  'field-meridian-pl-riverside-labor': {
    state: 'needs-review',
    aiReasoning:
      "A large block of overtime hours in November was coded to the wrong pay period in the payroll register, which may be double-counting about a week of hours. Using the register total as reported pending payroll's confirmation.",
    warnings: [
      {
        id: 'warn-meridian-riverside-labor',
        severity: 'warning',
        message: 'Possible double-counted overtime week in November payroll. Confirm with payroll before relying on this total.',
      },
    ],
  },
  // 11. A book-tax difference worth a second look given its size.
  'field-meridian-m1-line4': {
    state: 'needs-review',
    aiReasoning:
      "This is mostly the 50%-disallowed portion of meals & entertainment, but it's larger than prior years relative to revenue — worth confirming the underlying meals log supports this before relying on it.",
    warnings: [
      {
        id: 'warn-meridian-m1-line4',
        severity: 'info',
        message: 'Meals & entertainment addback is larger than prior years, proportionally. Spot-check the underlying log.',
      },
    ],
  },
}

const meridianFields: ReturnField[] = allMeridianFields.map((field) => {
  const override = HAND_CRAFTED_OVERRIDES[field.id]
  return override ? { ...field, ...override } : field
})

// ── Source documents (36 tied to fields above + 4 texture docs = 40) ───────
function doc(opts: Omit<SourceDocument, 'clientId' | 'returnId'>): SourceDocument {
  return { ...opts, clientId: MERIDIAN_CLIENT_ID, returnId: MERIDIAN_RETURN_ID }
}

export const meridianDocuments: SourceDocument[] = [
  doc({ id: DOC_TRIAL_BALANCE, fileName: 'Meridian_TrialBalance_FY2025.pdf', documentType: 'other', uploadedAt: '2026-06-18T09:00:00Z', uploadedBy: 'preparer', pageCount: 4, status: 'processed' }),
  doc({ id: DOC_PAYROLL, fileName: 'Meridian_ConsolidatedPayrollRegister_FY2025.pdf', documentType: 'other', uploadedAt: '2026-06-18T09:10:00Z', uploadedBy: 'preparer', pageCount: 5, status: 'processed' }),
  doc({ id: DOC_CAPITAL_LEDGER, fileName: 'Meridian_PartnerCapitalLedger_FY2025.pdf', documentType: 'other', uploadedAt: '2026-06-19T09:00:00Z', uploadedBy: 'preparer', pageCount: 2, status: 'processed' }),
  ...MERIDIAN_PARTNERS.map((p) =>
    doc({ id: docK1(p.name), fileName: `Meridian_ScheduleK1Draft_${slug(p.name)}_FY2025.pdf`, documentType: 'k-1', uploadedAt: '2026-06-25T09:00:00Z', uploadedBy: 'preparer', pageCount: 1, status: 'processed' }),
  ),
  ...MERIDIAN_LOCATIONS.map((l) =>
    doc({ id: docPos(l), fileName: `Meridian_${slug(l)}_POSAnnualSalesExport_FY2025.pdf`, documentType: 'other', uploadedAt: '2026-06-15T09:00:00Z', uploadedBy: 'client', pageCount: 2, status: l === 'Uptown' ? 'needs-attention' : 'processed' }),
  ),
  ...MERIDIAN_LOCATIONS.map((l) =>
    doc({ id: docBank(l), fileName: `Meridian_${slug(l)}_OperatingAccount_Statements_FY2025.pdf`, documentType: 'bank-statement', uploadedAt: '2026-06-16T09:00:00Z', uploadedBy: 'client', pageCount: 12, status: 'processed' }),
  ),
  ...MERIDIAN_LOCATIONS.map((l) =>
    doc({ id: docFixedAssets(l), fileName: `Meridian_${slug(l)}_FixedAssetSchedule_FY2025.pdf`, documentType: 'other', uploadedAt: '2026-06-17T09:00:00Z', uploadedBy: 'preparer', pageCount: 8, status: l === 'Harbor View' ? 'needs-attention' : 'processed' }),
  ),
  ...MERIDIAN_VENDORS.map((v) =>
    doc({ id: doc1099(v), fileName: `${slug(v)}_1099NEC_FY2025.pdf`, documentType: '1099-nec', uploadedAt: '2026-01-28T09:00:00Z', uploadedBy: 'client', pageCount: 1, status: 'processed' }),
  ),
  doc({ id: 'doc-meridian-partnership-agreement', fileName: 'Meridian_OperatingAgreement_Amended2025.pdf', documentType: 'other', uploadedAt: '2026-02-01T09:00:00Z', uploadedBy: 'client', pageCount: 24, status: 'processed' }),
  doc({ id: 'doc-meridian-prioryear', fileName: 'Meridian_2024_1065_PriorYear.pdf', documentType: 'prior-year-return', uploadedAt: '2026-06-10T09:00:00Z', uploadedBy: 'preparer', pageCount: 22, status: 'processed' }),
  doc({ id: 'doc-meridian-liability-insurance', fileName: 'Meridian_GeneralLiabilityInsurance_Invoice_2025.pdf', documentType: 'other', uploadedAt: '2026-03-05T09:00:00Z', uploadedBy: 'client', pageCount: 1, status: 'needs-attention' }),
  doc({ id: 'doc-meridian-pos-reconciliation-flag', fileName: 'Meridian_POSReconciliation_FlaggedDiscrepancies_FY2025.pdf', documentType: 'other', uploadedAt: '2026-07-10T09:00:00Z', uploadedBy: 'preparer', pageCount: 3, status: 'needs-attention' }),
]

// ── Message threads (30) — a mix of internal/client-visible, open/answered,
// spread across partners, locations, vendors, and general filing admin. ────
function thread(opts: {
  id: string
  subject: string
  visibility: 'internal' | 'client-visible'
  status: 'open' | 'answered'
  relatedFieldId?: string
  relatedDocumentId?: string
  messages: { author: string; authorType: 'preparer' | 'reviewer' | 'client'; body: string; at: string }[]
}): MessageThread {
  return {
    id: opts.id,
    returnId: MERIDIAN_RETURN_ID,
    subject: opts.subject,
    visibility: opts.visibility,
    status: opts.status,
    relatedFieldId: opts.relatedFieldId,
    relatedDocumentId: opts.relatedDocumentId,
    messages: opts.messages.map((m, i) => ({
      id: `msg-${opts.id}-${i + 1}`,
      authorType: m.authorType,
      authorName: m.author,
      body: m.body,
      createdAt: m.at,
    })),
    createdAt: opts.messages[0].at,
    updatedAt: opts.messages[opts.messages.length - 1].at,
  }
}

export const meridianThreads: MessageThread[] = [
  thread({
    id: 'thread-meridian-whitfield-gp-internal',
    subject: "D. Whitfield guaranteed payment — which agreement governs?",
    visibility: 'internal',
    status: 'open',
    relatedFieldId: 'field-meridian-k1-d-whitfield-box4',
    relatedDocumentId: 'doc-meridian-partnership-agreement',
    messages: [
      { author: 'Alicia Kim', authorType: 'preparer', at: '2026-07-14T10:00:00Z', body: "Whitfield's file has both the original $18k/year guaranteed-payment agreement and a $26k/year amendment signed mid-year. I prorated, but I don't see partner-vote minutes approving the amendment in what we have on file." },
      { author: 'James Whitfield', authorType: 'reviewer', at: '2026-07-15T09:30:00Z', body: "Let's get the partner vote minutes from R. Alvarez before we file on the amended figure — don't want to understate his guaranteed payments if the amendment wasn't properly adopted, or overstate it if it was." },
    ],
  }),
  thread({
    id: 'thread-meridian-whitfield-gp-client',
    subject: 'Quick question on your guaranteed payment amendment',
    visibility: 'client-visible',
    status: 'open',
    relatedFieldId: 'field-meridian-k1-d-whitfield-box4',
    messages: [
      { author: 'Alicia Kim', authorType: 'preparer', at: '2026-07-15T09:45:00Z', body: 'We have both your original guaranteed-payment agreement and the mid-year amendment on file. Can you send the partner-vote minutes approving the amendment so we can confirm the prorated figure is right?' },
    ],
  }),
  thread({
    id: 'thread-meridian-uptown-outage-internal',
    subject: 'Uptown POS outage — 3 days of sales missing',
    visibility: 'internal',
    status: 'open',
    relatedFieldId: 'field-meridian-pl-uptown-revenue',
    relatedDocumentId: 'doc-meridian-pos-reconciliation-flag',
    messages: [
      { author: 'Tom Delgado', authorType: 'preparer', at: '2026-07-11T14:20:00Z', body: "Uptown's POS export is missing 3 days from the September outage — manager says they logged sales on paper tickets but hasn't sent them yet." },
    ],
  }),
  thread({
    id: 'thread-meridian-uptown-outage-client',
    subject: 'Need the September paper ticket totals for Uptown',
    visibility: 'client-visible',
    status: 'open',
    relatedFieldId: 'field-meridian-pl-uptown-revenue',
    messages: [
      { author: 'Tom Delgado', authorType: 'preparer', at: '2026-07-11T14:25:00Z', body: 'Can you get us the manually-logged sales totals for the 3 days Uptown was offline in September? Revenue is understated without them.' },
    ],
  }),
  thread({
    id: 'thread-meridian-harborview-pos-photo',
    subject: 'Clearer photo needed — Harbor View POS invoice',
    visibility: 'client-visible',
    status: 'open',
    relatedFieldId: 'field-meridian-depr-harbor-view-pos-system',
    relatedDocumentId: 'doc-meridian-fixedassets-harbor-view',
    messages: [
      { author: 'Priya Nair', authorType: 'preparer', at: '2026-07-09T11:00:00Z', body: 'The Harbor View POS system invoice photo has glare across the total — can you send a clearer copy or the original vendor receipt?' },
    ],
  }),
  thread({
    id: 'thread-meridian-sec179-limit-internal',
    subject: 'Confirm Section 179 against income limitation',
    visibility: 'internal',
    status: 'open',
    relatedFieldId: 'field-meridian-schk-line12',
    messages: [
      { author: 'James Whitfield', authorType: 'reviewer', at: '2026-07-16T08:00:00Z', body: 'Total Section 179 across all 5 locations is a big number this year with the equipment refresh — double check it against the partnership income limitation before we finalize Schedule K.' },
    ],
  }),
  thread({
    id: 'thread-meridian-coastal-seafood-internal',
    subject: 'Coastal Seafood 1099 total — cross-checked',
    visibility: 'internal',
    status: 'answered',
    relatedFieldId: 'field-meridian-1099-coastal-seafood-distributors',
    messages: [
      { author: 'Alicia Kim', authorType: 'preparer', at: '2026-07-02T13:30:00Z', body: "AP ledger and the 1099-NEC total for Coastal Seafood were off by a few hundred dollars — cross-checked against the vendor's own remittance advice and confirmed our figure." },
      { author: 'Alicia Kim', authorType: 'preparer', at: '2026-07-02T13:41:00Z', body: 'Confirmed and updated.' },
    ],
  }),
  thread({
    id: 'thread-meridian-apex-dispute-client',
    subject: 'Apex Waste Management disputes our total',
    visibility: 'client-visible',
    status: 'open',
    relatedFieldId: 'field-meridian-1099-apex-waste-management',
    relatedDocumentId: 'doc-meridian-1099-apex-waste-management',
    messages: [
      { author: 'Tom Delgado', authorType: 'preparer', at: '2026-07-13T09:00:00Z', body: 'Apex says a service credit was never applied to their total. Can you confirm with them directly whether that credit should reduce the 1099 amount?' },
    ],
  }),
  thread({
    id: 'thread-meridian-lakeside-vehicle-internal',
    subject: 'Lakeside delivery vehicle sold mid-year',
    visibility: 'internal',
    status: 'open',
    relatedFieldId: 'field-meridian-depr-lakeside-delivery-vehicle',
    messages: [
      { author: 'Priya Nair', authorType: 'preparer', at: '2026-07-08T10:00:00Z', body: 'Lakeside sold their delivery vehicle in August. Depreciation here is a full-year estimate — needs proration to the sale date plus a Form 4797 gain/loss.' },
    ],
  }),
  thread({
    id: 'thread-meridian-riverside-labor-internal',
    subject: 'Possible double-counted overtime — Riverside',
    visibility: 'internal',
    status: 'open',
    relatedFieldId: 'field-meridian-pl-riverside-labor',
    relatedDocumentId: 'doc-meridian-payroll-register',
    messages: [
      { author: 'Alicia Kim', authorType: 'preparer', at: '2026-07-12T15:00:00Z', body: 'November overtime at Riverside looks like it might be coded to two pay periods instead of one — flagging before we lock the location P&L.' },
    ],
  }),
  thread({
    id: 'thread-meridian-nkemelu-capital-internal',
    subject: "T. Nkemelu capital account — $340 off from prior draft",
    visibility: 'internal',
    status: 'answered',
    relatedFieldId: 'field-meridian-capital-t-nkemelu-ending',
    messages: [
      { author: 'Tom Delgado', authorType: 'preparer', at: '2026-07-05T09:00:00Z', body: "Our computed ending capital for Nkemelu is $340 off from last year's software draft. Likely a Section 179 rounding difference." },
      { author: 'James Whitfield', authorType: 'reviewer', at: '2026-07-05T16:00:00Z', body: "Agreed, that's within normal rounding drift. Not worth chasing further — note it and move on." },
    ],
  }),
  thread({
    id: 'thread-meridian-alvarez-otherpartnership-client',
    subject: 'Waiting on the other partnership K-1',
    visibility: 'client-visible',
    status: 'open',
    relatedFieldId: 'field-meridian-1065-line4',
    messages: [
      { author: 'Alicia Kim', authorType: 'preparer', at: '2026-07-01T10:15:00Z', body: "We're using your estimated $2,400 for the equipment-leasing partnership share for now. Let us know as soon as that K-1 actually arrives so we can true it up before filing." },
    ],
  }),
  thread({
    id: 'thread-meridian-downtown-marketing-receipts',
    subject: 'Missing marketing receipts — Downtown Crossing',
    visibility: 'client-visible',
    status: 'open',
    messages: [
      { author: 'Tom Delgado', authorType: 'preparer', at: '2026-07-10T09:00:00Z', body: "A few Downtown Crossing marketing expenses don't have receipts attached yet — can you upload them when you get a chance?" },
    ],
  }),
  thread({
    id: 'thread-meridian-riverside-pos-integration',
    subject: 'Confirm new POS go-live date at Riverside',
    visibility: 'client-visible',
    status: 'answered',
    messages: [
      { author: 'Priya Nair', authorType: 'preparer', at: '2026-05-20T09:00:00Z', body: 'Can you confirm the exact date Riverside switched POS systems? Want to make sure we\'re not double-counting sales across the transition.' },
      { author: 'R. Alvarez', authorType: 'client', at: '2026-05-21T14:00:00Z', body: 'April 1 — clean cutover, old system was fully shut down that day.' },
    ],
  }),
  thread({
    id: 'thread-meridian-harborview-lease-internal',
    subject: 'Harbor View lease renewal terms',
    visibility: 'internal',
    status: 'answered',
    messages: [
      { author: 'Priya Nair', authorType: 'preparer', at: '2026-04-10T09:00:00Z', body: 'Harbor View renewed its lease in April with a rent step-up — confirm the new rate is reflected in the FY2025 total, not the old one.' },
      { author: 'Priya Nair', authorType: 'preparer', at: '2026-04-15T09:00:00Z', body: 'Confirmed — new rate applied from April forward, old rate for Jan–Mar.' },
    ],
  }),
  thread({
    id: 'thread-meridian-lakeside-insurance-client',
    subject: 'General liability insurance invoice — need the paid receipt',
    visibility: 'client-visible',
    status: 'open',
    relatedDocumentId: 'doc-meridian-liability-insurance',
    messages: [
      { author: 'Tom Delgado', authorType: 'preparer', at: '2026-03-06T09:00:00Z', body: 'We only have the invoice for the general liability policy, not proof of payment — can you send the paid receipt or a bank confirmation?' },
    ],
  }),
  thread({
    id: 'thread-meridian-okafor-address-client',
    subject: 'Confirm mailing address for your K-1',
    visibility: 'client-visible',
    status: 'answered',
    messages: [
      { author: 'Alicia Kim', authorType: 'preparer', at: '2026-06-28T09:00:00Z', body: 'Want to confirm the mailing address on file for your Schedule K-1 is still current before we send copies.' },
      { author: 'S. Okafor', authorType: 'client', at: '2026-06-29T08:00:00Z', body: 'Still the same, thanks for checking.' },
    ],
  }),
  thread({
    id: 'thread-meridian-park-gp-request',
    subject: 'Requesting a guaranteed payment increase',
    visibility: 'client-visible',
    status: 'open',
    messages: [
      { author: 'M. Park', authorType: 'client', at: '2026-07-14T18:00:00Z', body: "I'd like to discuss increasing my guaranteed payment for next year given the Lakeside expansion — can we set up a call?" },
    ],
  }),
  thread({
    id: 'thread-meridian-bianchi-contribution-internal',
    subject: 'L. Bianchi capital contribution — confirmed',
    visibility: 'internal',
    status: 'answered',
    messages: [
      { author: 'Tom Delgado', authorType: 'preparer', at: '2026-06-30T09:00:00Z', body: "Bianchi's additional capital contribution this year is confirmed against the bank deposit — matches what's in the capital ledger." },
    ],
  }),
  thread({
    id: 'thread-meridian-alvarez-sec179-signoff',
    subject: 'Managing-partner sign-off on Section 179 elections',
    visibility: 'internal',
    status: 'open',
    relatedFieldId: 'field-meridian-schk-line12',
    messages: [
      { author: 'James Whitfield', authorType: 'reviewer', at: '2026-07-16T10:00:00Z', body: "Once we confirm the income limitation, let's get R. Alvarez's sign-off as managing partner before these elections are finalized." },
    ],
  }),
  thread({
    id: 'thread-meridian-bianchilinen-1099-internal',
    subject: 'Bianchi Linen Service — corrected 1099 received late',
    visibility: 'internal',
    status: 'answered',
    relatedDocumentId: 'doc-meridian-1099-bianchi-linen-service',
    messages: [
      { author: 'Alicia Kim', authorType: 'preparer', at: '2026-02-10T09:00:00Z', body: 'Bianchi Linen sent a corrected 1099 after we\'d already started — swapped in the corrected figure, no material difference.' },
    ],
  }),
  thread({
    id: 'thread-meridian-prochef-threshold-internal',
    subject: 'ProChef Equipment Repair — under $600 threshold?',
    visibility: 'internal',
    status: 'answered',
    relatedDocumentId: 'doc-meridian-1099-prochef-equipment-repair',
    messages: [
      { author: 'Tom Delgado', authorType: 'preparer', at: '2026-01-30T09:00:00Z', body: 'Double-checked — ProChef payments do exceed the $600 1099-NEC threshold for the year in aggregate, so the 1099 we issued is correct.' },
    ],
  }),
  thread({
    id: 'thread-meridian-extension-timeline-client',
    subject: 'Extension filing timeline',
    visibility: 'client-visible',
    status: 'open',
    messages: [
      { author: 'Alicia Kim', authorType: 'preparer', at: '2026-07-16T09:00:00Z', body: "Given the open items (Whitfield's guaranteed payment, Uptown's outage, a couple vendor questions), we'd recommend filing the extension while we finish these up rather than rushing the March 16 deadline. OK to proceed?" },
    ],
  }),
  thread({
    id: 'thread-meridian-partner-signoff-internal',
    subject: "Emma's final review before filing",
    visibility: 'internal',
    status: 'open',
    messages: [
      { author: 'James Whitfield', authorType: 'reviewer', at: '2026-07-16T11:00:00Z', body: 'Once the guaranteed-payment, Uptown revenue, and Section 179 items are closed out, this is ready for your final partner review.' },
    ],
  }),
  thread({
    id: 'thread-meridian-pos-reconciliation-internal',
    subject: 'Review the flagged POS reconciliation report',
    visibility: 'internal',
    status: 'open',
    relatedDocumentId: 'doc-meridian-pos-reconciliation-flag',
    messages: [
      { author: 'Tom Delgado', authorType: 'preparer', at: '2026-07-10T09:15:00Z', body: 'Attached the full flagged-discrepancy report across all 5 locations — Uptown is the only one that actually affects a field total, the rest are sub-$50 rounding noise.' },
    ],
  }),
  thread({
    id: 'thread-meridian-prioryear-comparison-internal',
    subject: 'Prior-year comparison looks reasonable',
    visibility: 'internal',
    status: 'answered',
    relatedDocumentId: 'doc-meridian-prioryear',
    messages: [
      { author: 'Priya Nair', authorType: 'preparer', at: '2026-06-22T09:00:00Z', body: "Compared this year's totals against the FY2024 filed return — revenue growth and expense ratios are all within normal range except the equipment refresh driving Section 179 higher." },
    ],
  }),
  thread({
    id: 'thread-meridian-uptown-checkin-client',
    subject: 'Any update on the September outage tickets?',
    visibility: 'client-visible',
    status: 'open',
    relatedFieldId: 'field-meridian-pl-uptown-revenue',
    messages: [
      { author: 'Tom Delgado', authorType: 'preparer', at: '2026-07-16T09:30:00Z', body: 'Following up — any progress getting those September paper ticket totals from the Uptown manager?' },
    ],
  }),
  thread({
    id: 'thread-meridian-greenfield-produce-internal',
    subject: 'Greenfield Produce — seasonal payment pattern confirmed',
    visibility: 'internal',
    status: 'answered',
    messages: [
      { author: 'Alicia Kim', authorType: 'preparer', at: '2026-02-05T09:00:00Z', body: 'Greenfield Produce payments are heavily front-loaded in the summer months — normal seasonal pattern for produce, not an error.' },
    ],
  }),
  thread({
    id: 'thread-meridian-elite-security-internal',
    subject: 'Elite Security Systems — confirm which locations covered',
    visibility: 'internal',
    status: 'answered',
    messages: [
      { author: 'Tom Delgado', authorType: 'preparer', at: '2026-02-08T09:00:00Z', body: "Confirmed Elite Security's contract covers all 5 locations under one consolidated invoice, so the full amount is allocated as a single vendor total rather than split." },
    ],
  }),
  thread({
    id: 'thread-meridian-newlocation-scouting-client',
    subject: 'Heads up on a possible 6th location',
    visibility: 'client-visible',
    status: 'open',
    messages: [
      { author: 'R. Alvarez', authorType: 'client', at: '2026-07-15T19:00:00Z', body: "We're scouting a 6th location for next year — nothing signed yet, but wanted to give you a heads up for planning purposes." },
    ],
  }),
]

// ── Client + Return ──────────────────────────────────────────────────────
export const meridianClient: Client = {
  id: MERIDIAN_CLIENT_ID,
  name: 'Meridian Hospitality Group LLC',
  type: 'business',
  email: 'controller@meridianhospitalitygroup.com',
  phone: '(617) 555-0134',
  isNewClient: false,
  isStaffMember: false,
  createdAt: '2019-08-01T00:00:00Z',
}

export const meridianReturn: Return = {
  id: MERIDIAN_RETURN_ID,
  clientId: MERIDIAN_CLIENT_ID,
  entityType: 'partnership',
  taxYear: 2025,
  status: 'in-review',
  dueDate: '2026-03-16',
  extendedDueDate: '2026-09-15',
  preparerId: 'tm-alicia',
  reviewerId: 'tm-james',
  blockingIssues: [
    {
      id: 'issue-meridian-whitfield-gp',
      description:
        "D. Whitfield's guaranteed payment conflicts between an original agreement and a mid-year amendment — need partner-vote minutes confirming the amendment before filing.",
      severity: 'high',
      relatedFieldId: 'field-meridian-k1-d-whitfield-box4',
      createdAt: '2026-07-14T10:00:00Z',
      resolved: false,
    },
    {
      id: 'issue-meridian-uptown-outage',
      description: "Uptown's September POS outage left 3 days of sales unrecorded — revenue is understated until the manual tickets are entered.",
      severity: 'high',
      relatedFieldId: 'field-meridian-pl-uptown-revenue',
      createdAt: '2026-07-11T14:20:00Z',
      resolved: false,
    },
    {
      id: 'issue-meridian-sec179-limit',
      description: "Aggregate Section 179 elections across all 5 locations haven't been checked against the partnership's income limitation.",
      severity: 'medium',
      relatedFieldId: 'field-meridian-schk-line12',
      createdAt: '2026-07-16T08:00:00Z',
      resolved: false,
    },
  ],
  fields: meridianFields,
  createdAt: '2026-06-15T09:00:00Z',
  updatedAt: '2026-07-16T11:00:00Z',
}
