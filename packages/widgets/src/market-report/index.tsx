import React from 'react';
import { createRoot } from 'react-dom/client';
import { MarketReport } from './MarketReport.js';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');
const root = createRoot(container);
root.render(<MarketReport />);
