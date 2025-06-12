import React from 'react';
import { calculateFireProjection } from '../utils/calculator.js';
import {
    Box,
    TextField,
    Typography,
    Grid,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    IconButton,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    FormControlLabel,
    Switch
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

const STATES = [
    'CA', 'AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY'
];

const NetWorthChart = ({ data, fireAge }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="age"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    label={{ value: 'Age', position: 'bottom', offset: 15 }}
                    tick={false}
                />
                <YAxis
                    type="number"
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    label={{ value: 'Net Worth', angle: -90, position: 'left' }}
                />
                <Tooltip
                    formatter={(value, name) => {
                        const formattedValue = `$${(value / 1000000).toFixed(2)}M`;
                        return [formattedValue, name];
                    }}
                    labelFormatter={(label) => `Age: ${label}`}
                />
                <Legend
                    align="left"
                    verticalAlign="top"
                    wrapperStyle={{ paddingBottom: '20px' }}
                />
                {data.filter(d => d.age % 5 === 0).map((d) => (
                    <ReferenceLine
                        key={`ref-${d.age}`}
                        x={d.age}
                        stroke="#ccc"
                        strokeDasharray="3 3"
                        label={{
                            value: d.age,
                            position: 'bottom',
                            offset: 5,
                            fill: '#666'
                        }}
                    />
                ))}
                <Line
                    type="monotone"
                    dataKey="nominal"
                    name="Nominal Net Worth"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={false}
                />
                <Line
                    type="monotone"
                    dataKey="real"
                    name="Real Net Worth"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={false}
                />
                {fireAge > 0 && (
                    <ReferenceLine x={fireAge} stroke="red" label="FIRE Age" />
                )}
                <ReferenceLine y={0} stroke="black" strokeWidth={2} strokeDasharray="5 5" label="" />
            </ComposedChart>
        </ResponsiveContainer>
    );
};

const FireCalculator = () => {
    const [inputs, setInputs] = React.useState({
        currentAge: 23,
        endAge: 50,
        currentNetWorth: 70000,
        annualReturn: 8,
        inflationRate: 3,
        retirementSpending: 100000,
        withdrawalRate: 4,
        state: 'CA',
        preTax401k: 23000,
        employerMatch: 5
    });

    const [yearlySpending, setYearlySpending] = React.useState([
        { id: 'spending-1', startAge: 23, endAge: 50, spending: 100000 }
    ]);

    const [yearlyIncome, setYearlyIncome] = React.useState([
        { id: 'income-1', startAge: 23, endAge: 25, income: 230000 },
        { id: 'income-2', startAge: 26, endAge: 30, income: 300000 },
        { id: 'income-3', startAge: 31, endAge: 40, income: 400000 }
    ]);

    const [results, setResults] = React.useState(null);
    const [stopAtFire, setStopAtFire] = React.useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: name === 'state' ? value : Number(value)
        }));
    };

    const handleStateChange = (event) => {
        setInputs({
            ...inputs,
            state: event.target.value
        });
    };

    const handleSpendingChange = (index, field, value) => {
        const newData = [...yearlySpending];
        newData[index] = { ...newData[index], [field]: value };
        setYearlySpending(newData);
    };

    const handleIncomeChange = (index, field, value) => {
        const newData = [...yearlyIncome];
        newData[index] = { ...newData[index], [field]: value };
        setYearlyIncome(newData);
    };

    const addYearlyData = (type) => {
        const newEntry = {
            id: `${type}-${Date.now()}`,
            startAge: inputs.currentAge,
            endAge: inputs.endAge,
            [type]: 0
        };
        if (type === 'spending') {
            setYearlySpending([...yearlySpending, newEntry]);
        } else {
            setYearlyIncome([...yearlyIncome, newEntry]);
        }
    };

    const removeSpending = (index) => {
        setYearlySpending(yearlySpending.filter((_, i) => i !== index));
    };

    const removeIncome = (index) => {
        setYearlyIncome(yearlyIncome.filter((_, i) => i !== index));
    };

    const handleCalculate = () => {
        const result = calculateFireProjection({
            ...inputs,
            yearlySpending: yearlySpending.map(d => ({
                startAge: d.startAge,
                endAge: d.endAge,
                amount: d.spending
            })),
            yearlyIncome: yearlyIncome.map(d => ({
                startAge: d.startAge,
                endAge: d.endAge,
                amount: d.income
            })),
            stopAtFire: stopAtFire && (results?.fireAge ?? 0) > 0
        });
        setResults(result);
    };

    const getSavingsColor = (savings) => {
        if (savings < 0) return 'red';
        if (savings > 0) return 'green';
        return 'inherit';
    };

    const getRowBackgroundColor = (savings, netWorthGrowth, netWorth) => {
        if (netWorth < 0) return '#ffebee';
        if (netWorthGrowth < 0) return '#fff3e0';
        if (savings < 0) return '#faf9c4';
        if (savings > 0) return '#e8f5e8';
        return 'inherit';
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                FIRE Calculator
            </Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Enter the money in today's dollars.
                    </Typography>
                </Grid>

                {/* Basic Information */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Basic Information
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    fullWidth
                                    label="Current Age"
                                    name="currentAge"
                                    type="number"
                                    value={inputs.currentAge}
                                    onChange={handleInputChange}
                                    inputProps={{ min: 0 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    fullWidth
                                    label="End Age"
                                    name="endAge"
                                    type="number"
                                    value={inputs.endAge}
                                    onChange={handleInputChange}
                                    inputProps={{ min: inputs.currentAge + 1 }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Current Net Worth"
                                    name="currentNetWorth"
                                    type="number"
                                    value={inputs.currentNetWorth}
                                    onChange={handleInputChange}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                                    }}
                                    inputProps={{ min: 0 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Nominal Annual Return (%)"
                                    name="annualReturn"
                                    type="number"
                                    value={inputs.annualReturn}
                                    onChange={handleInputChange}
                                    inputProps={{ min: 0, max: 100 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Inflation Rate (%)"
                                    name="inflationRate"
                                    type="number"
                                    value={inputs.inflationRate}
                                    onChange={handleInputChange}
                                    inputProps={{ min: 0, max: 100 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Retirement Spending"
                                    name="retirementSpending"
                                    type="number"
                                    value={inputs.retirementSpending}
                                    onChange={handleInputChange}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                                    }}
                                    inputProps={{ min: 0 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Withdrawal Rate (%)"
                                    name="withdrawalRate"
                                    type="number"
                                    value={inputs.withdrawalRate}
                                    onChange={handleInputChange}
                                    inputProps={{ min: 0, max: 100 }}
                                />
                            </Grid>
                        </Grid>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Real return rate: {(((1 + inputs.annualReturn / 100) / (1 + inputs.inflationRate / 100) - 1) * 100).toFixed(1)}%
                            (nominal {inputs.annualReturn}% ÷ inflation {inputs.inflationRate}%)
                        </Typography>
                    </Paper>
                </Grid>

                {/* Retirement Accounts */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Retirement Accounts
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Pre-tax 401(k) Contribution"
                                    name="preTax401k"
                                    type="number"
                                    value={inputs.preTax401k}
                                    onChange={handleInputChange}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                                    }}
                                    inputProps={{ min: 0 }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Employer Match (%)"
                                    name="employerMatch"
                                    type="number"
                                    value={inputs.employerMatch}
                                    onChange={handleInputChange}
                                    inputProps={{ min: 0, max: 100 }}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Yearly Spending */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Yearly Spending
                        </Typography>
                        {yearlySpending.map((item) => (
                            <Grid container spacing={2} key={item.id} sx={{ mb: 2 }}>
                                <Grid item xs={12} sm={3}>
                                    <TextField
                                        fullWidth
                                        label="Start Age"
                                        type="number"
                                        value={item.startAge}
                                        onChange={(e) => handleSpendingChange(yearlySpending.indexOf(item), 'startAge', Number(e.target.value))}
                                        inputProps={{ min: inputs.currentAge, max: inputs.endAge }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <TextField
                                        fullWidth
                                        label="End Age"
                                        type="number"
                                        value={item.endAge}
                                        onChange={(e) => handleSpendingChange(yearlySpending.indexOf(item), 'endAge', Number(e.target.value))}
                                        inputProps={{ min: inputs.currentAge, max: inputs.endAge }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={5}>
                                    <TextField
                                        fullWidth
                                        label="Amount"
                                        type="number"
                                        value={item.spending}
                                        onChange={(e) => handleSpendingChange(yearlySpending.indexOf(item), 'spending', Number(e.target.value))}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>
                                        }}
                                        inputProps={{ min: 0 }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IconButton onClick={() => removeSpending(yearlySpending.indexOf(item))} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        ))}
                        <Button
                            startIcon={<AddIcon />}
                            onClick={() => addYearlyData('spending')}
                            sx={{ mt: 1 }}
                        >
                            Add Spending
                        </Button>
                    </Paper>
                </Grid>

                {/* Yearly Income */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Yearly Income
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>State</InputLabel>
                                    <Select
                                        value={inputs.state}
                                        label="State"
                                        onChange={handleStateChange}
                                    >
                                        {STATES.map(state => (
                                            <MenuItem key={state} value={state}>{state}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                        {yearlyIncome.map((item) => (
                            <Grid container spacing={2} key={item.id} sx={{ mb: 2 }}>
                                <Grid item xs={12} sm={3}>
                                    <TextField
                                        fullWidth
                                        label="Start Age"
                                        type="number"
                                        value={item.startAge}
                                        onChange={(e) => handleIncomeChange(yearlyIncome.indexOf(item), 'startAge', Number(e.target.value))}
                                        inputProps={{ min: inputs.currentAge, max: inputs.endAge }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <TextField
                                        fullWidth
                                        label="End Age"
                                        type="number"
                                        value={item.endAge}
                                        onChange={(e) => handleIncomeChange(yearlyIncome.indexOf(item), 'endAge', Number(e.target.value))}
                                        inputProps={{ min: inputs.currentAge, max: inputs.endAge }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={5}>
                                    <TextField
                                        fullWidth
                                        label="Amount"
                                        type="number"
                                        value={item.income}
                                        onChange={(e) => handleIncomeChange(yearlyIncome.indexOf(item), 'income', Number(e.target.value))}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>
                                        }}
                                        inputProps={{ min: 0 }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IconButton onClick={() => removeIncome(yearlyIncome.indexOf(item))} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        ))}
                        <Button
                            startIcon={<AddIcon />}
                            onClick={() => addYearlyData('income')}
                            sx={{ mt: 1 }}
                        >
                            Add Income
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={stopAtFire}
                                onChange={(e) => setStopAtFire(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Stop at FIRE (Set spending to retirement amount and income to 0 after FIRE age)"
                    />
                </Grid>

                <Grid item xs={12}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCalculate}
                        fullWidth
                        size="large"
                    >
                        Calculate
                    </Button>
                </Grid>

                {results && (
                    <>
                        <Box sx={{ width: '100%' }}>
                            <Paper sx={{ p: 2, mt: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Results
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    <Box sx={{ flex: '1 1 300px' }}>
                                        <Typography variant="subtitle1">
                                            FIRE Age: {results.fireAge ? results.fireAge : 'Not Possible'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: '1 1 300px' }}>
                                        <Typography variant="subtitle1">
                                            Required Savings: {results.requiredSavings ? `$${results.requiredSavings.toLocaleString()}` : 'Not Possible'}
                                        </Typography>
                                    </Box>
                                    {results.error && (
                                        <Typography color="error" variant="body1" gutterBottom>
                                            {results.error}
                                        </Typography>
                                    )}
                                </Box>
                            </Paper>
                        </Box>

                        <Box sx={{ width: '100%', mt: 2 }}>
                            <Paper sx={{ 
                                p: 2,
                                width: '100%',
                                height: { xs: '300px', sm: '400px', md: '500px' }
                            }}>
                                {results && (
                                    <Box sx={{ width: '100%', height: '100%' }}>
                                        <NetWorthChart
                                            data={results.years.map((year, index) => ({
                                                age: year,
                                                nominal: Math.round(results.nominalNetWorth[index]),
                                                real: Math.round(results.realNetWorth[index]),
                                                afterTaxIncome: Math.round(results.yearlyAfterTaxIncome[index]),
                                                spending: Math.round(results.yearlySpending[index])
                                            }))}
                                            fireAge={results.fireAge}
                                        />
                                    </Box>
                                )}
                            </Paper>
                        </Box>

                        <Box sx={{ width: '100%', mt: 2 }}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Yearly Financial Breakdown
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    All values shown in today's money.
                                    Real return rate: {(((1 + inputs.annualReturn / 100) / (1 + inputs.inflationRate / 100) - 1) * 100).toFixed(1)}%
                                    (nominal {inputs.annualReturn}% ÷ inflation {inputs.inflationRate}%)
                                </Typography>
                                {results && (
                                    <Box sx={{ width: '100%', overflowX: 'auto' }}>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell><strong>Age</strong></TableCell>
                                                        <TableCell align="right"><strong>Pre-Tax Income</strong></TableCell>
                                                        <TableCell align="right"><strong>After-Tax Income</strong></TableCell>
                                                        <TableCell align="right"><strong>Tax Rate</strong></TableCell>
                                                        <TableCell align="right"><strong>Spending</strong></TableCell>
                                                        <TableCell align="right"><strong>Savings</strong></TableCell>
                                                        <TableCell align="right"><strong>Interest Earned</strong></TableCell>
                                                        <TableCell align="right"><strong>Net Worth Growth</strong></TableCell>
                                                        <TableCell align="right"><strong>Net Worth</strong></TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {results.years.map((year, index) => (
                                                        <TableRow 
                                                            key={`row-${year}`}
                                                            sx={{ 
                                                                backgroundColor: getRowBackgroundColor(
                                                                    results.yearlySavings[index],
                                                                    results.yearlySavings[index] + results.yearlyRealInterest[index],
                                                                    results.realNetWorth[index]
                                                                ),
                                                                '&:hover': { backgroundColor: '#f5f5f5' }
                                                            }}
                                                        >
                                                            <TableCell component="th" scope="row">
                                                                <strong>{year}</strong>
                                                                {results.fireAge === year && (
                                                                    <Box component="span" sx={{ ml: 1, color: 'red', fontWeight: 'bold' }}>
                                                                        🔥 FIRE
                                                                    </Box>
                                                                )}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                ${Math.round(results.yearlyPreTaxIncome[index]).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                ${Math.round(results.yearlyAfterTaxIncome[index]).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                {results.yearlyTaxRates[index].toFixed(1)}%
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                ${Math.round(results.yearlySpending[index]).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell 
                                                                align="right"
                                                                sx={{ 
                                                                    color: getSavingsColor(results.yearlySavings[index]),
                                                                    fontWeight: results.yearlySavings[index] !== 0 ? 'bold' : 'normal'
                                                                }}
                                                            >
                                                                ${Math.round(results.yearlySavings[index]).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell 
                                                                align="right"
                                                                sx={{ 
                                                                    color: getSavingsColor(results.yearlyRealInterest[index]),
                                                                    fontWeight: results.yearlyRealInterest[index] !== 0 ? 'bold' : 'normal'
                                                                }}
                                                            >
                                                                ${Math.round(results.yearlyRealInterest[index]).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell 
                                                                align="right"
                                                                sx={{ 
                                                                    color: getSavingsColor(results.yearlySavings[index] + results.yearlyRealInterest[index]),
                                                                    fontWeight: (results.yearlySavings[index] + results.yearlyRealInterest[index]) !== 0 ? 'bold' : 'normal'
                                                                }}
                                                            >
                                                                ${Math.round(results.yearlySavings[index] + results.yearlyRealInterest[index]).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell 
                                                                align="right"
                                                                sx={{ 
                                                                    color: results.realNetWorth[index] < 0 ? 'error.main' : 'inherit',
                                                                    fontWeight: results.realNetWorth[index] < 0 ? 'bold' : 'normal'
                                                                }}
                                                            >
                                                                ${Math.round(results.realNetWorth[index]).toLocaleString()}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}
                            </Paper>
                        </Box>
                    </>
                )}
            </Grid>
        </Box>
    );
};

export default FireCalculator; 