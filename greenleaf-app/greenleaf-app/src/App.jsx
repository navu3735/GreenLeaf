// src/App.jsx
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import PartA from './pages/PartA';
import PartB from './pages/PartB';
import PartC from './pages/PartC';
import data from './data.json';
import { fmtDate } from './utils/format.js';
import './global.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="app">
      <Sidebar
        active={activeTab}
        onChange={setActiveTab}
        meta={{
          farms: data.meta.farms,
          greenhouses: data.meta.greenhouses,
          plots: data.meta.plots,
          date_min: fmtDate(data.meta.date_min),
          date_max: fmtDate(data.meta.date_max),
        }}
      />
      <main className="main">
        {activeTab === 'overview' && <Overview data={data} />}
        {activeTab === 'partA' && <PartA data={data} />}
        {activeTab === 'partB' && <PartB data={data} />}
        {activeTab === 'partC' && <PartC data={data} />}
      </main>
    </div>
  );
}