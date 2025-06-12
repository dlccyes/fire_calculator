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

const STATE_TAX_RATES = {
  'CA': [
    { threshold: 0, rate: 0.01 },
    { threshold: 10099, rate: 0.02 },
    { threshold: 23942, rate: 0.04 },
    { threshold: 37788, rate: 0.06 },
    { threshold: 52455, rate: 0.08 },
    { threshold: 66295, rate: 0.093 },
    { threshold: 338639, rate: 0.103 },
    { threshold: 406364, rate: 0.113 },
    { threshold: 677275, rate: 0.123 }
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

export function calculateTaxes(taxData) {
  const { income, state, preTax401k, backdoorRoth } = taxData;
  
  // Calculate taxable income
  const taxableIncome = Math.max(0, income - preTax401k);
  
  // Calculate federal tax
  const federalTax = calculateTax(taxableIncome, FEDERAL_TAX_BRACKETS);
  
  // Calculate state tax
  const stateBrackets = STATE_TAX_RATES[state] || [];
  const stateTax = stateBrackets.length > 0 ? calculateTax(taxableIncome, stateBrackets) : 0;
  
  // Calculate total tax
  const totalTax = federalTax + stateTax;
  
  // Calculate after-tax income
  const afterTaxIncome = income - totalTax;
  
  return {
    afterTaxIncome,
    totalTax,
    federalTax,
    stateTax
  };
} 