'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { calculatePlacement, getVerdict, EngineInputs } from '@/lib/engine';
import providersData from '@/data/providers.json';
import { Gauge, Zap, Database, ShieldAlert, Activity, ThermometerSun } from 'lucide-react';

const RC_BLUE = '#1DABDD';
const RC_NAVY = '#0F172A';

export default function GravityEngine() {
  const [inputs, setInputs] = useState<EngineInputs>({
    datasetSizeGB: 50000,
    monthlyTokensMillions: 100,
    dutyCycle: 1.0,
    opexAdder: 0.20,
    complianceMode: false,
    isLegacyFacility: false,
    customGpuHr: undefined,
    customEgressGb: undefined,
  });

  const results = useMemo(() => calculatePlacement(inputs), [inputs]);
  const recommendation = results
    .filter(r => r.isEligible)
    .sort((a, b) => a.totalMonthlyTCO - b.totalMonthlyTCO)[0];
  
  const winnerProvider = recommendation.providerId === 'custom_byor' 
    ? { name: 'Marketplace (BYOR)' } 
    : providersData.providers.find(p => p.id === recommendation.providerId);
    
  const winnerVerdict = getVerdict(recommendation, inputs);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" style={{ backgroundColor: RC_NAVY }}>
      
      {/* HEADER */}
      <header className="px-4 md:px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between bg-slate-900/90 z-50 shadow-md gap-4">
        <div className="flex items-center gap-3">
          <Image 
            src="/images/rack2cloud-logo-300x99.jpg" 
            alt="RACK2CLOUD"
            width={150} height={50}
            priority
            style={{ height: 'auto' }}
            className="object-contain"
          />
          <div className="h-6 w-px bg-slate-700 hidden sm:block" />
          <h1 className="text-xs md:text-sm font-black tracking-widest text-white uppercase italic">AI Gravity & Placement Engine</h1>
        </div>
        
        <div className="flex gap-3 items-center bg-slate-800/50 px-3 py-1 rounded border border-slate-700">
           <Activity className="w-4 h-4 text-blue-400" />
           <div className="text-[9px] uppercase tracking-tighter leading-tight">
              <p className="font-bold text-slate-200">Llama 3 70B BF16</p>
              <p className="text-slate-500 font-medium">145GB VRAM Locked</p>
           </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-col md:flex-row flex-1 md:overflow-hidden">
        
        {/* SIDEBAR */}
        <aside className="w-full md:w-[320px] border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 p-6 flex flex-col gap-6 md:overflow-y-auto">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
            <Database className="w-3 h-3" /> System Variables
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-8">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                <span>Data Volume</span>
                <span className="text-blue-400 font-mono text-sm font-bold">{inputs.datasetSizeGB.toLocaleString()} GB</span>
              </div>
              <input type="range" min="1000" max="250000" step="1000"
                style={{ accentColor: RC_BLUE }}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                value={inputs.datasetSizeGB}
                onChange={(e) => setInputs({...inputs, datasetSizeGB: parseInt(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                <span>Duty Cycle</span>
                <span className="text-blue-400 font-mono text-sm font-bold">{(inputs.dutyCycle * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min="0.1" max="1.0" step="0.1"
                style={{ accentColor: RC_BLUE }}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                value={inputs.dutyCycle}
                onChange={(e) => setInputs({...inputs, dutyCycle: parseFloat(e.target.value)})}
              />
            </div>

            {/* LEGACY TOGGLE & OPEX SLIDER */}
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-start">
                  <input 
                    type="checkbox" 
                    className="peer sr-only"
                    checked={inputs.isLegacyFacility}
                    onChange={(e) => setInputs({...inputs, isLegacyFacility: e.target.checked})}
                  />
                  <div className="w-4 h-4 border border-slate-600 rounded bg-slate-900 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all flex items-center justify-center mt-0.5">
                    {inputs.isLegacyFacility && <ThermometerSun className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">
                    Legacy Data Center (Pre-2018)
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium mt-0.5">
                    +15% Cooling & PUE Tax
                  </span>
                </div>
              </label>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className={inputs.isLegacyFacility ? "text-blue-400" : "text-slate-400"}>
                    OpEx Adder {inputs.isLegacyFacility && inputs.opexAdder < 0.35 && "— (Floor Applied)"}
                  </span>
                  <span className="text-blue-400 font-mono text-sm font-bold">
                    {((inputs.isLegacyFacility ? Math.max(inputs.opexAdder, 0.35) : inputs.opexAdder) * 100).toFixed(0)}%
                  </span>
                </div>
                <input type="range" min="0.1" max="0.5" step="0.05"
                  style={{ accentColor: RC_BLUE }}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  value={inputs.opexAdder}
                  onChange={(e) => setInputs({...inputs, opexAdder: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            {/* COMPLIANCE TOGGLE */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between sm:col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sovereign Mode</span>
              <button 
                onClick={() => setInputs({...inputs, complianceMode: !inputs.complianceMode})}
                className={`w-10 h-5 rounded-full transition-all relative ${inputs.complianceMode ? 'bg-blue-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${inputs.complianceMode ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>

            {/* BYOR MARKETPLACE INPUTS */}
            <div className="pt-4 border-t border-slate-800 space-y-4 sm:col-span-2 md:col-span-1">
              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Marketplace (BYOR)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400">GPU $/HR</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    onChange={(e) => setInputs({...inputs, customGpuHr: parseFloat(e.target.value) || undefined})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400">EGRESS $/GB</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    onChange={(e) => setInputs({...inputs, customEgressGb: parseFloat(e.target.value) || undefined})}
                  />
                </div>
              </div>
            </div>

          </div>
        </aside>

        {/* DASHBOARD */}
        <section className="flex-1 p-4 md:p-6 flex flex-col gap-6 md:overflow-y-auto">
          
          {/* ARCHITECT VERDICT HERO */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 md:p-7 relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:grid lg:grid-cols-[1fr,280px] items-start gap-8">
              <div className="space-y-5 w-full">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 italic">Architect Verdict</span>
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tighter uppercase leading-none">{winnerProvider?.name}</h2>
                <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2">
                  <Gauge className="w-3 h-3" /> {winnerVerdict.verdict}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-800 pt-5">
                   <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reasoning</h4>
                      <p className="text-slate-200 text-sm leading-relaxed font-medium">{winnerVerdict.reasoning}</p>
                   </div>
                   <div className="bg-blue-500/5 p-4 rounded border border-blue-500/10 space-y-2">
                      <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <ShieldAlert className="w-3 h-3" /> Architect Verdict
                      </h4>
                      <p className="text-slate-100 text-sm md:text-base font-semibold italic leading-relaxed">{winnerVerdict.tip}</p>
                   </div>
                </div>
              </div>

              <div className="w-full lg:w-auto flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center border-t lg:border-t-0 lg:border-l border-slate-800 pt-6 lg:pt-0 lg:pl-10 text-right">
                <div className="text-left lg:text-right">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 block">Token TCO</span>
                  <div className="text-4xl md:text-6xl font-mono text-green-400 font-bold leading-none tracking-tighter">${recommendation.tokenTCO.toFixed(2)}</div>
                </div>
                <div className="text-slate-400 text-[10px] md:text-[11px] font-mono mt-0 lg:mt-4 font-bold tracking-tight uppercase bg-slate-800/50 lg:bg-transparent px-2 py-1 rounded lg:p-0">
                  Monthly: ${recommendation.totalMonthlyTCO.toLocaleString(undefined, {maximumFractionDigits: 0})}
                </div>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-300 min-w-[600px]">
                <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-[0.2em] border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left">Infrastructure Tier</th>
                    <th className="px-6 py-3 text-right">Gravity (G)</th>
                    <th className="px-6 py-3 text-right font-bold">Monthly TCO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {results.map((res) => {
                    const name = res.providerId === 'custom_byor' 
                      ? 'Marketplace (BYOR)' 
                      : providersData.providers.find(prov => prov.id === res.providerId)?.name;
                    
                    if (!res.isEligible) return null;
                    const isWinner = res.providerId === recommendation.providerId;
                    
                    return (
                      <tr key={res.providerId} className={`transition-all ${isWinner ? 'bg-blue-500/10' : 'hover:bg-slate-800/40'}`}>
                        <td className="px-6 py-3 font-bold text-slate-100 flex items-center gap-3">
                          {isWinner && <Zap className="w-3 h-3 text-green-400 fill-green-400" />}
                          {name}
                        </td>
                        <td className={`px-6 py-3 text-right font-mono ${res.gravityScore > 0.5 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                          {res.gravityDisplay}
                        </td>
                        <td className="px-6 py-3 text-right font-mono font-bold text-slate-100 text-sm">
                          ${res.totalMonthlyTCO.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          <footer className="text-[9px] text-slate-500 text-center uppercase tracking-[0.4em] mt-auto pb-4 pt-2">
             *Lambda 0.0% reflects lack of published egress; bandwidth limits apply.
          </footer>
        </section>
      </div>
    </main>
  );
}