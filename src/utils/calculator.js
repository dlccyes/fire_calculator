import { calculateTaxes } from './tax.js';

function calculateYearlyData(year, yearlyIncome, yearlySpending, stopAtFire, retirementSpending, endAge, fireAge) {
  const grossIncome = yearlyIncome.reduce((sum, inc) => 
    (inc.startAge <= year && year <= inc.endAge) ? sum + inc.amount : sum, 0);
  
  const spending = yearlySpending.reduce((sum, exp) => 
    (exp.startAge <= year && year <= exp.endAge) ? sum + exp.amount : sum, 0);
  
  if (stopAtFire && year >= fireAge) {
    return {
      grossIncome: 0,
      spending: retirementSpending,
      yearlyIncome: [],
      yearlySpending: [{
        startAge: year,
        endAge: endAge,
        amount: retirementSpending
      }]
    };
  }
  return {
    grossIncome,
    spending,
    yearlyIncome,
    yearlySpending
  };
}

function calculateIncomeTax(grossIncome, state, preTax401k, backdoorRoth, employerMatch) {
  if (grossIncome <= 0) {
    return {
      totalAvailableIncome: 0,
      effectiveTaxRate: 0,
      afterTaxIncome: 0
    };
  }
  
  const backdoorRothAmount = grossIncome * backdoorRoth;
  const taxData = {
    income: grossIncome,
    state: state,
    preTax401k: preTax401k,
    backdoorRoth: backdoorRothAmount
  };
  
  const taxResult = calculateTaxes(taxData);
  const afterTaxIncome = taxResult.afterTaxIncome;
  const effectiveTaxRate = (taxResult.totalTax / grossIncome) * 100;
  const employerContribution = grossIncome * employerMatch;
  
  return {
    totalAvailableIncome: afterTaxIncome + employerContribution,
    effectiveTaxRate,
    afterTaxIncome
  };
}

function calculateNetWorth(currentNetWorth, previousRealBalance, realReturnRate, i) {
  if (i === 0) {
    return {
      realBalance: currentNetWorth,
      realInterestEarned: currentNetWorth
    };
  }
  
  const realInterestEarned = previousRealBalance * realReturnRate;
  const realBalance = previousRealBalance + realInterestEarned;
  return {
    realBalance,
    realInterestEarned
  };
}

export function calculateFireProjection(data) {
  // Extract input parameters
  const currentAge = data.currentAge;
  const endAge = data.endAge;
  const currentNetWorth = data.currentNetWorth || 0;
  const annualReturn = data.annualReturn / 100;
  const inflationRate = data.inflationRate / 100;
  const retirementSpending = data.retirementSpending;
  const withdrawalRate = data.withdrawalRate / 100;
  const preTax401k = data.preTax401k;
  const employerMatch = data.employerMatch / 100;
  const backdoorRoth = data.backdoorRoth / 100;
  const state = data.state || 'CA';
  const stopAtFire = data.stopAtFire || false;
  
  // Calculate real return rate and check FIRE possibility
  const realReturnRate = (1 + annualReturn) / (1 + inflationRate) - 1;
  const firePossible = withdrawalRate <= realReturnRate;
  const requiredSavings = retirementSpending / withdrawalRate;
  
  // Initialize arrays
  const years = Array.from({ length: endAge - currentAge + 1 }, (_, i) => currentAge + i);
  const arrays = {
    realNetWorth: new Array(years.length).fill(0),
    yearlyAfterTaxIncome: new Array(years.length).fill(0),
    yearlySpendingAmounts: new Array(years.length).fill(0),
    yearlyPreTaxIncome: new Array(years.length).fill(0),
    yearlyTaxRates: new Array(years.length).fill(0),
    yearlySavings: new Array(years.length).fill(0),
    yearlyRealInterest: new Array(years.length).fill(0)
  };
  
  let yearlySpending = data.yearlySpending || [];
  let yearlyIncome = data.yearlyIncome || [];
  
  // First pass to find FIRE age
  let fireAge = null;
  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const { grossIncome, spending } = calculateYearlyData(
      year, yearlyIncome, yearlySpending, false, retirementSpending, endAge
    );
    
    const { totalAvailableIncome } = calculateIncomeTax(
      grossIncome, state, preTax401k, backdoorRoth, employerMatch
    );
    
    const { realBalance, realInterestEarned } = calculateNetWorth(
      currentNetWorth,
      arrays.realNetWorth[i-1] || currentNetWorth,
      realReturnRate,
      i
    );
    
    const savings = totalAvailableIncome - spending;
    arrays.realNetWorth[i] = i === 0 ? currentNetWorth : arrays.realNetWorth[i-1] + savings + realInterestEarned;
    
    if (arrays.realNetWorth[i] >= requiredSavings) {
      fireAge = year;
      break;
    }
  }
  
  // Reset arrays for second pass
  arrays.realNetWorth.fill(0);
  arrays.yearlyAfterTaxIncome.fill(0);
  arrays.yearlySpendingAmounts.fill(0);
  arrays.yearlyPreTaxIncome.fill(0);
  arrays.yearlyTaxRates.fill(0);
  arrays.yearlySavings.fill(0);
  arrays.yearlyRealInterest.fill(0);
  
  // Second pass with actual calculations
  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const { grossIncome, spending, yearlyIncome: newYearlyIncome, yearlySpending: newYearlySpending } = calculateYearlyData(
      year, yearlyIncome, yearlySpending, stopAtFire, retirementSpending, endAge, fireAge
    );
    yearlyIncome = newYearlyIncome;
    yearlySpending = newYearlySpending;
    
    const { totalAvailableIncome, effectiveTaxRate } = calculateIncomeTax(
      grossIncome, state, preTax401k, backdoorRoth, employerMatch
    );
    
    const { realBalance, realInterestEarned } = calculateNetWorth(
      currentNetWorth,
      arrays.realNetWorth[i-1] || currentNetWorth,
      realReturnRate,
      i
    );
    
    const savings = totalAvailableIncome - spending;
    
    // Update arrays
    arrays.realNetWorth[i] = i === 0 ? currentNetWorth : arrays.realNetWorth[i-1] + savings + realInterestEarned;
    arrays.yearlyPreTaxIncome[i] = grossIncome;
    arrays.yearlyAfterTaxIncome[i] = totalAvailableIncome;
    arrays.yearlySpendingAmounts[i] = spending;
    arrays.yearlyTaxRates[i] = effectiveTaxRate;
    arrays.yearlySavings[i] = savings;
    arrays.yearlyRealInterest[i] = i > 0 ? realInterestEarned : 0;
  }
  
  // Calculate nominal values from real values
  const nominalNetWorth = arrays.realNetWorth.map((real, i) => 
    real * Math.pow(1 + inflationRate, i)
  );
  
  const result = {
    years,
    nominalNetWorth,
    realNetWorth: arrays.realNetWorth,
    yearlyPreTaxIncome: arrays.yearlyPreTaxIncome,
    yearlyAfterTaxIncome: arrays.yearlyAfterTaxIncome,
    yearlySpending: arrays.yearlySpendingAmounts,
    yearlyTaxRates: arrays.yearlyTaxRates,
    yearlySavings: arrays.yearlySavings,
    yearlyRealInterest: arrays.yearlyRealInterest,
    fireAge,
    requiredSavings
  };
  
  if (!firePossible) {
    result.error = `FIRE is not possible: Withdrawal rate (${(withdrawalRate*100).toFixed(1)}%) exceeds real return rate (${(realReturnRate*100).toFixed(1)}%)`;
    result.fireAge = null;
  }
  
  return result;
} 