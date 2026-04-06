'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { calculatePlacement, getVerdict, EngineInputs } from '@/lib/engine';
import providersData from '@/data/providers.json';
import { Info, Gauge, Zap, Database, ShieldAlert, Binary } from 'lucide-react';

const RC_BLUE = '#1DABDD';
const RC_NAVY = '#0F172A';

export default function GravityEngine() {
  const [inputs, setInputs] = useState<EngineInputs>({
    datasetSizeGB: 50000,
    monthlyTokensMillions: 100,
    dutyCycle: 1.0,
    opexAdder: 0.20,
    complianceMode: false,
  });

  const results = useMemo(() => calculatePlacement(inputs), [inputs]);
  const recommendation = results
    .filter(r => r.isEligible)
    .sort((a, b) => a.totalMonthlyTCO - b.totalMonthlyTCO)[0];
  
  const winnerProvider = providersData.providers.find(p => p.id === recommendation.providerId);
  const winnerVerdict = getVerdict(recommendation, inputs);

  return (
    <main className="h-screen overflow-hidden text-slate-100 flex flex-col font-sans" style={{ backgroundColor: RC_NAVY }}>
      
      {/* HEADER */}
      <header className="px-6 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 z-50">
        <div className="flex items-center gap-4">
          <Image 
            src="/images/rack2cloud-logo-300x99.jpg" 
            alt="RACK2CLOUD"
            width={180} height={60}
            priority
            className="object-contain"
          />
          <div className="h-8 w-px bg-slate-700" />
          <h1 className="text-sm font-black tracking-widest text-white uppercase italic">AI Gravity & Placement Engine</h1>
        </div>
        
        <div className="flex gap-3 items-center bg-slate-800/50 px-3 py-1 rounded border border-slate-700">
           <Binary className="w-4 h-4 text-blue-400" />
           <div className="text-[9px] uppercase tracking-tighter leading-tight">
              <p className="font-bold text-slate-200">Llama 3 70B BF16</p>
              <p className="text-slate-500 font-medium">145GB VRAM Locked</p>
           </div>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR: VARIABLES */}
        <aside className="w-[300px] border-r border-slate-800 bg-slate-950/40 p-6 flex flex-col gap-6 overflow-y-auto">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
            <Database className="w-3 h-3" /> System Variables
          </h2>
          
          <div className="flex flex-col gap-8">
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

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                <span>OpEx Adder</span>
                <span className="text-blue-400 font-mono text-sm font-bold">{(inputs.opexAdder * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min="0.1" max="0.5" step="0.05"
                style={{ accentColor: RC_BLUE }}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                value={inputs.opexAdder}
                onChange={(e) => setInputs({...inputs, opexAdder: parseFloat(e.target.value)})}
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sovereign Mode</span>
              <button 
                onClick={() => setInputs({...inputs, complianceMode: !inputs.complianceMode})}
                className={`w-10 h-5 rounded-full transition-all relative ${inputs.complianceMode ? 'bg-blue-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${inputs.complianceMode ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </aside>

        {/* DASHBOARD CONTENT */}
        <section className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* ARCHITECT'S VERDICT HERO */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-7 relative overflow-hidden">
            <div className="relative z-10 grid grid-cols-[1fr,280px] items-start gap-10">
              <div className="space-y-5">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Architect&apos;s Verdict</span>
                <h2 className="text-4xl font-bold text-white tracking-tighter uppercase leading-none">{winnerProvider?.name}</h2>
                <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2">
                  <Gauge className="w-3 h-3" /> {winnerVerdict.verdict}
                </div>
                
                <div className="grid grid-cols-2 gap-6 border-t border-slate-800 pt-5">
                   <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reasoning</h4>
                      <p className="text-slate-200 text-sm leading-relaxed font-medium">{winnerVerdict.reasoning}</p>
                   </div>
                   <div className="bg-blue-500/5 p-4 rounded border border-blue-500/10 space-y-2">
                      <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <ShieldAlert className="w-3 h-3" /> Architect's Verdict
                      </h4>
                      <p className="text-slate-100 text-base font-semibold italic leading-relaxed">{winnerVerdict.tip}</p>
                   </div>
                </div>
              </div>

              <div className="flex flex-col items-end justify-center border-l border-slate-800 pl-10 text-right">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Token TCO</span>
                <div className="text-6xl font-mono text-green-400 font-bold leading-none tracking-tighter">${recommendation.tokenTCO.toFixed(2)}</div>
                <div className="text-slate-400 text-[11px] font-mono mt-4 font-bold tracking-tight">MONTHLY: ${recommendation.totalMonthlyTCO.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
              </div>
            </div>

            {/* WATERMARK */}
            <div className="absolute -right-12 -bottom-12 opacity-[0.05] pointer-events-none">
               <Image src="/images/Rack2Cloud_icon.jpg" alt="" width={260} height={260} />
            </div>
          </div>

          {/* PROVIDER COMPARISON */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-[0.2em] border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left">Infrastructure Tier</th>
                  <th className="px-6 py-3 text-right">Gravity (G)</th>
                  <th className="px-6 py-3 text-right font-bold">Monthly TCO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {results.map((res) => {
                  const p = providersData.providers.find(prov => prov.id === res.providerId);
                  if (!res.isEligible) return null;
                  const isWinner = res.providerId === recommendation.providerId;
                  return (
                    <tr key={res.providerId} className={`transition-all ${isWinner ? 'bg-blue-500/10' : 'hover:bg-slate-800/40'}`}>
                      <td className="px-6 py-2.5 font-bold text-slate-100 flex items-center gap-3">
                        {isWinner && <Zap className="w-3 h-3 text-green-400 fill-green-400" />}
                        {p?.name}
                      </td>
                      <td className={`px-6 py-2.5 text-right font-mono ${res.gravityScore > 0.5 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                        {res.gravityDisplay}
                      </td>
                      <td className="px-6 py-2.5 text-right font-mono font-bold text-slate-100 text-sm">
                        ${res.totalMonthlyTCO.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <footer className="text-[9px] text-slate-500 text-center uppercase tracking-[0.4em] mt-auto pb-2">
             *Lambda 0.0% reflects lack of published egress; bandwidth limits apply.
          </footer>
        </section>
      </div>
    </main>
  );
}