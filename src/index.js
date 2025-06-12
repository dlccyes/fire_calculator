import React from 'react';
import { createRoot } from 'react-dom/client';
import FireCalculator from './components/FireCalculator';
import './styles/styles.css';

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<FireCalculator />); 