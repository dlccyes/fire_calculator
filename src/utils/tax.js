// Tax brackets for 2024
const FEDERAL_TAX_BRACKETS = [
  { threshold: 0, rate: 0.10 },
  { threshold: 11600, rate: 0.12 },
  { threshold: 47150, rate: 0.22 },
  { threshold: 100525, rate: 0.24 },
  { threshold: 191950, rate: 0.32 },
  { threshold: 243725, rate: 0.35 },
  { threshold: 609350, rate: 0.37 }
];

// Standard deductions for 2024
const FEDERAL_STANDARD_DEDUCTION = 14600; // Single filer
const CALIFORNIA_STANDARD_DEDUCTION = 5540; // Single filer

// FICA tax rates for 2024
const SOCIAL_SECURITY_RATE = 0.062; // 6.2% for employee
const MEDICARE_RATE = 0.0145; // 1.45% for employee
const ADDITIONAL_MEDICARE_RATE = 0.009; // 0.9% for high earners
const SOCIAL_SECURITY_WAGE_BASE = 168600; // 2024 limit
const ADDITIONAL_MEDICARE_THRESHOLD = 200000; // 2024 threshold for additional Medicare tax

const STATE_TAX_RATES = {
  'CA': [
    { threshold: 0, rate: 0.01 },
    { threshold: 10757, rate: 0.02 },
    { threshold: 25500, rate: 0.04 },
    { threshold: 40246, rate: 0.06 },
    { threshold: 55867, rate: 0.08 },
    { threshold: 70607, rate: 0.093 },
    { threshold: 360660, rate: 0.103 },
    { threshold: 432788, rate: 0.113 },
    { threshold: 721315, rate: 0.123 }
  ],
  'AK': [], // No state income tax
  'FL': [], // No state income tax
  'NV': [], // No state income tax
  'NH': [], // Only taxes interest and dividends
  'SD': [], // No state income tax
  'TN': [], // No state income tax
  'TX': [], // No state income tax
  'WA': [], // No state income tax
  'WY': []  // No state income tax
};

function calculateTax(income, brackets) {
  let tax = 0;
  let remainingIncome = income;

  for (let i = brackets.length - 1; i >= 0; i--) {
    const bracket = brackets[i];
    if (income > bracket.threshold) {
      const taxableInThisBracket = remainingIncome - bracket.threshold;
      tax += taxableInThisBracket * bracket.rate;
      remainingIncome = bracket.threshold;
    }
  }

  return tax;
}

function calculateFICA(income) {
  // Social Security tax (capped at wage base)
  const socialSecurityTax = Math.min(income, SOCIAL_SECURITY_WAGE_BASE) * SOCIAL_SECURITY_RATE;
  
  // Regular Medicare tax (no cap)
  const medicareTax = income * MEDICARE_RATE;
  
  // Additional Medicare tax for high earners (0.9% on income above threshold)
  const additionalMedicareTax = Math.max(0, income - ADDITIONAL_MEDICARE_THRESHOLD) * ADDITIONAL_MEDICARE_RATE;
  
  return {
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    totalFICA: socialSecurityTax + medicareTax + additionalMedicareTax
  };
}

export function calculateTaxes(taxData) {
  const { income, state, preTax401k } = taxData;
  
  // Calculate FICA taxes
  const socialSecurityTax = Math.min(income, SOCIAL_SECURITY_WAGE_BASE) * SOCIAL_SECURITY_RATE;
  const medicareTax = income * MEDICARE_RATE;
  const additionalMedicareTax = Math.max(0, income - ADDITIONAL_MEDICARE_THRESHOLD) * ADDITIONAL_MEDICARE_RATE;
  const totalFicaTax = socialSecurityTax + medicareTax + additionalMedicareTax;

  // Calculate taxable income for federal tax
  const federalTaxableIncome = income - preTax401k - FEDERAL_STANDARD_DEDUCTION;
  
  // Calculate taxable income for state tax
  const stateTaxableIncome = income - preTax401k - (state === 'CA' ? CALIFORNIA_STANDARD_DEDUCTION : 0);

  // Calculate federal income tax
  let federalTax = 0;
  let remainingIncome = federalTaxableIncome;
  for (let i = FEDERAL_TAX_BRACKETS.length - 1; i >= 0; i--) {
    const bracket = FEDERAL_TAX_BRACKETS[i];
    if (federalTaxableIncome > bracket.threshold) {
      const taxableInBracket = remainingIncome - bracket.threshold;
      federalTax += taxableInBracket * bracket.rate;
      remainingIncome = bracket.threshold;
    }
  }

  // Calculate state income tax
  let stateTax = 0;
  if (state && STATE_TAX_RATES[state] && STATE_TAX_RATES[state].length > 0) {
    remainingIncome = stateTaxableIncome;
    for (let i = STATE_TAX_RATES[state].length - 1; i >= 0; i--) {
      const bracket = STATE_TAX_RATES[state][i];
      if (stateTaxableIncome > bracket.threshold) {
        const taxableInBracket = remainingIncome - bracket.threshold;
        stateTax += taxableInBracket * bracket.rate;
        remainingIncome = bracket.threshold;
      }
    }
  }

  const totalTax = federalTax + stateTax + totalFicaTax;
  const afterTaxIncome = income - totalTax;

  return {
    afterTaxIncome,
    totalTax,
    federalTax,
    stateTax,
    ficaTaxes: {
      socialSecurity: socialSecurityTax,
      medicare: medicareTax,
      additionalMedicare: additionalMedicareTax,
      totalFICA: totalFicaTax
    }
  };
} 