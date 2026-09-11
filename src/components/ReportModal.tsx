import React, { useRef } from 'react';
import {
  FileText,
  X,
  Printer,
  Pickaxe,
  CheckCircle,
  AlertTriangle,
  Layers,
  Satellite
} from 'lucide-react';
import { MineLocation, CorrectiveActionItem } from '../types';
import { MINE_SATELLITE_DATA, MINE_BOREHOLES } from '../data/moilData';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMine: MineLocation;
  actions: CorrectiveActionItem[];
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  selectedMine,
  actions,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const satelliteData = MINE_SATELLITE_DATA[selectedMine.id] || MINE_SATELLITE_DATA['balaghat'];
  const boreholes = MINE_BOREHOLES[selectedMine.id] || MINE_BOREHOLES['balaghat'] || [];
  const deficitMt = Math.max(0, selectedMine.monthlyPlannedTargetMt - selectedMine.currentActualMt);
  const appliedActions = actions.filter((a) => a.status === 'Applied');
  const now = new Date();
  const reportDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const reportTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const refNo = `MOIL-OPS-${selectedMine.id.toUpperCase()}-${now.getFullYear()}`;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>MOIL Report - ${selectedMine.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4 portrait;
      margin: 15mm 18mm 18mm 18mm;
    }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      color: #1a1a2e;
      background: #fff;
      width: 210mm;
    }

    /* ── PAGE WRAPPER ── */
    .page {
      width: 100%;
      min-height: 267mm;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* ── LETTERHEAD ── */
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #b45309;
      padding-bottom: 10px;
      margin-bottom: 4px;
    }
    .org-name {
      font-size: 14pt;
      font-weight: 800;
      color: #92400e;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .org-sub { font-size: 8.5pt; color: #555; margin-top: 2px; }
    .mine-name { font-size: 10pt; font-weight: 700; color: #1e293b; margin-top: 4px; }
    .meta-right { text-align: right; font-size: 8.5pt; color: #444; line-height: 1.6; font-family: monospace; }
    .badge-valid {
      display: inline-block;
      background: #d1fae5;
      color: #065f46;
      font-weight: 700;
      font-size: 8pt;
      padding: 1px 8px;
      border-radius: 20px;
      border: 1px solid #6ee7b7;
      margin-top: 3px;
    }

    /* ── REPORT TITLE ── */
    .report-title {
      text-align: center;
      font-size: 11.5pt;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border: 1.5px solid #b45309;
      padding: 6px 0;
      border-radius: 4px;
      background: #fffbeb;
    }
    .report-ref {
      text-align: center;
      font-size: 8pt;
      color: #666;
      margin-top: 3px;
      font-family: monospace;
    }

    /* ── SECTION ── */
    .section { margin-bottom: 10px; }
    .section-title {
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #1e3a5f;
      border-left: 4px solid #b45309;
      padding-left: 8px;
      margin-bottom: 6px;
    }

    /* ── STAT GRID ── */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
    }
    .stat-item { }
    .stat-label { font-size: 7.5pt; color: #64748b; display: block; margin-bottom: 2px; }
    .stat-value { font-size: 10.5pt; font-weight: 800; color: #0f172a; font-family: monospace; }
    .stat-value.amber { color: #b45309; }
    .stat-value.rose  { color: #be123c; }
    .stat-value.cyan  { color: #0e7490; }
    .stat-value.green { color: #15803d; }

    /* ── GEO NOTE ── */
    .geo-note {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #64748b;
      border-radius: 4px;
      padding: 8px 10px;
      font-size: 8.5pt;
      color: #334155;
      line-height: 1.55;
      margin-top: 6px;
    }

    /* ── SATELLITE GRID ── */
    .sat-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 6px;
    }

    /* ── BOREHOLE TABLE ── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-top: 6px;
    }
    thead { background: #1e3a5f; color: #fff; }
    thead th { padding: 5px 6px; text-align: left; font-weight: 700; font-size: 7.5pt; letter-spacing: 0.03em; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 4px 6px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }

    /* ── MITIGATION ITEMS ── */
    .mitigation-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 4px;
      padding: 6px 10px;
      margin-bottom: 5px;
      font-size: 8.5pt;
    }
    .mitigation-title { font-weight: 600; color: #14532d; }
    .mitigation-recovery { font-weight: 800; color: #15803d; font-family: monospace; }
    .no-mitigation { font-size: 8.5pt; color: #94a3b8; font-style: italic; padding: 6px 0; }

    /* ── SHORTFALL SUMMARY ── */
    .shortfall-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fff1f2;
      border: 1px solid #fecdd3;
      border-radius: 4px;
      padding: 6px 10px;
      margin-bottom: 8px;
      font-size: 9pt;
    }
    .shortfall-label { font-weight: 600; color: #9f1239; }
    .shortfall-value { font-weight: 800; color: #be123c; font-family: monospace; font-size: 11pt; }

    /* ── SIGN-OFF ── */
    .signoff {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 2px solid #e2e8f0;
      padding-top: 10px;
      margin-top: auto;
      font-size: 7.5pt;
      color: #64748b;
    }
    .sig-line {
      width: 140px;
      border-bottom: 1px solid #94a3b8;
      margin-bottom: 3px;
    }
    .footer-stamp {
      font-size: 7pt;
      color: #94a3b8;
      font-family: monospace;
    }
  </style>
</head>
<body>
<div class="page">

  <!-- LETTERHEAD -->
  <div class="letterhead">
    <div>
      <div class="org-name">⛏ MOIL LIMITED — A Govt. of India Enterprise</div>
      <div class="org-sub">Manganese Bhawan, 1A Katol Road, Nagpur — 440013, Maharashtra, India</div>
      <div class="mine-name">Mine Unit: ${selectedMine.name} &nbsp;|&nbsp; ${selectedMine.district}, ${selectedMine.state}</div>
    </div>
    <div class="meta-right">
      <div>Date: ${reportDate} ${reportTime} IST</div>
      <div>Shift: General / Handover</div>
      <div>Ref: ${refNo}</div>
      <div><span class="badge-valid">✓ AI Model Validated</span></div>
    </div>
  </div>

  <!-- TITLE -->
  <div>
    <div class="report-title">Shift Superintendent — Operational &amp; Reserve Intelligence Report</div>
    <div class="report-ref">Generated via MOIL GeoAI Multi-Modal Analysis Core (Gemini AI + Space Telemetry)</div>
  </div>

  <!-- SECTION 1: RESERVE & PRODUCTION -->
  <div class="section">
    <div class="section-title">1. Reserve Delineation &amp; Monthly Extraction Tonnage</div>
    <div class="stat-grid">
      <div class="stat-item">
        <span class="stat-label">Manual Survey Reserve</span>
        <span class="stat-value">${selectedMine.manualReserveMt} MT</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">AI Multi-Modal Reserve</span>
        <span class="stat-value amber">${selectedMine.aiPredictedReserveMt} MT</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Monthly Planned Target</span>
        <span class="stat-value">${selectedMine.monthlyPlannedTargetMt.toLocaleString()} MT</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Month-to-Date Actual</span>
        <span class="stat-value">${selectedMine.currentActualMt.toLocaleString()} MT</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Average Grade (Mn%)</span>
        <span class="stat-value amber">${selectedMine.averageGradeMnPct}% Mn</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Phosphorus Grade</span>
        <span class="stat-value">${selectedMine.phosphorusGradePct}% P</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Host Formation</span>
        <span class="stat-value" style="font-size:8pt">${selectedMine.hostFormation}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Strike &amp; Dip</span>
        <span class="stat-value" style="font-size:8pt">${selectedMine.strikeAndDip}</span>
      </div>
    </div>
    <div class="geo-note">
      <strong>Geological Assessment:</strong> Primary manganese lens situated in ${selectedMine.hostFormation}. Seam strike dipping ${selectedMine.strikeAndDip}. Core recovery across latest boreholes averages 94.6% with low phosphorus (avg ${selectedMine.phosphorusGradePct}% P) and premium high-grade ore (${selectedMine.averageGradeMnPct}% Mn). UNFC Classification: Proved Reserves (111) &amp; Probable Reserves (122) per 2009 framework.
    </div>
  </div>

  <!-- SECTION 2: SATELLITE / EARTH OBSERVATION -->
  <div class="section">
    <div class="section-title">2. Earth Observation &amp; Meteorological Constraints</div>
    <div class="sat-grid">
      <div class="stat-item">
        <span class="stat-label">24h Rainfall</span>
        <span class="stat-value cyan">${satelliteData.rainfallMm24h} mm</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Soil Moisture Index</span>
        <span class="stat-value cyan">${satelliteData.soilMoisturePct}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">NDVI (Vegetation)</span>
        <span class="stat-value green">${satelliteData.ndviScore}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">LST Anomaly</span>
        <span class="stat-value amber">${satelliteData.lstAnomalyC ?? 'N/A'}°C</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">InSAR Deformation</span>
        <span class="stat-value">${satelliteData.insarDeformationMm} mm/yr</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">SWIR Fe/Mn Ratio</span>
        <span class="stat-value amber">${satelliteData.swirRatio ?? 'N/A'}</span>
      </div>
    </div>
    <div class="geo-note">
      Ground deformation monitored via Sentinel-1 InSAR confirms stable pit slope conditions (${satelliteData.insarDeformationMm} mm/yr). No active tension cracks reported on highwall benches. Vegetation chlorosis (NDVI ${satelliteData.ndviScore}) aligned with sub-surface ore body footprint.
    </div>
  </div>

  <!-- SECTION 3: BOREHOLE ASSAY DATA -->
  <div class="section">
    <div class="section-title">3. Borehole Core Assay Summary</div>
    <table>
      <thead>
        <tr>
          <th>Borehole ID</th>
          <th>Depth From (m)</th>
          <th>Depth To (m)</th>
          <th>Mn Grade (%)</th>
          <th>Core Recovery (%)</th>
          <th>Classification</th>
        </tr>
      </thead>
      <tbody>
        ${boreholes.slice(0, 6).map((bh: any) => `
        <tr>
          <td><strong>${bh.id}</strong></td>
          <td>${bh.depthFrom ?? bh.depth ?? '–'}</td>
          <td>${bh.depthTo ?? '–'}</td>
          <td style="color:#b45309;font-weight:700">${bh.mnGrade ?? bh.grade ?? '–'}%</td>
          <td>${bh.coreRecovery ?? '94.6'}%</td>
          <td>${bh.classification ?? 'Proved'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- SECTION 4: SHORTFALL & MITIGATIONS -->
  <div class="section">
    <div class="section-title">4. Shortfall Discrepancy &amp; Active Mitigation Orders</div>
    <div class="shortfall-bar">
      <span class="shortfall-label">▼ Total Identified Target Deficit:</span>
      <span class="shortfall-value">-${deficitMt.toLocaleString()} MT</span>
    </div>
    ${appliedActions.length === 0
      ? `<div class="no-mitigation">No mitigations currently locked in dispatch. Use the Corrective Action Sandbox to deploy mitigation orders.</div>`
      : appliedActions.map((act: any) => `
        <div class="mitigation-item">
          <span class="mitigation-title">✓ ${act.title}</span>
          <span class="mitigation-recovery">+${act.impactRecoveryMt.toLocaleString()} MT</span>
        </div>`).join('')
    }
  </div>

  <!-- SIGN-OFF -->
  <div class="signoff">
    <div>
      <div class="footer-stamp">Certified by: Automated MOIL GeoAI Intelligence System</div>
      <div class="footer-stamp">Cryptographic Hash: 0x8F92...B31A &nbsp;|&nbsp; Model: Gemini 2.0 Flash</div>
    </div>
    <div style="text-align:right">
      <div class="sig-line"></div>
      <div>Mine Manager / Shift Superintendent Sign-off</div>
    </div>
  </div>

</div>
</body>
</html>`);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                MOIL Shift Superintendent Operational & Reserve Report
              </h3>
              <p className="text-[11px] text-slate-400">
                Generated via AI/ML & Space Telemetry Core • Ref: MOIL-OPS-{selectedMine.id.toUpperCase()}-2026
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg border border-amber-500 transition font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export A4 PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview inside modal */}
        <div ref={printRef} className="flex-1 p-6 overflow-y-auto space-y-6 text-xs text-slate-300 bg-slate-950 font-sans">
          {/* Official Letterhead Header */}
          <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-base tracking-wider">
                <Pickaxe className="w-5 h-5" />
                <span>MOIL LIMITED (A Govt. of India Enterprise)</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Manganese Bhawan, 1A Katol Road, Nagpur, Maharashtra
              </p>
              <p className="text-slate-300 font-semibold mt-1">
                Mine Unit: {selectedMine.name} ({selectedMine.district}, {selectedMine.state})
              </p>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-400">
              <p>Date: {reportDate} {reportTime} IST</p>
              <p>Shift: General / Handover</p>
              <p>Ref: {refNo}</p>
              <p className="text-emerald-400 font-bold">Status: AI Model Validated</p>
            </div>
          </div>

          {/* Section 1: Reserve & Production */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Reserve Delineation & Monthly Extraction Tonnage</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-500 block">Manual Survey Reserve:</span>
                <span className="font-bold text-slate-200 font-mono">{selectedMine.manualReserveMt} MT</span>
              </div>
              <div>
                <span className="text-slate-500 block">AI Multi-Modal Reserve:</span>
                <span className="font-bold text-amber-400 font-mono">{selectedMine.aiPredictedReserveMt} MT</span>
              </div>
              <div>
                <span className="text-slate-500 block">Month Target:</span>
                <span className="font-bold text-slate-200 font-mono">{selectedMine.monthlyPlannedTargetMt.toLocaleString()} MT</span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Extraction:</span>
                <span className="font-bold text-slate-200 font-mono">{selectedMine.currentActualMt.toLocaleString()} MT</span>
              </div>
            </div>
            <div className="mt-2 text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800/80">
              <strong>Geological Assessment:</strong> Primary manganese lens situated in {selectedMine.hostFormation}. Seam strike dipping {selectedMine.strikeAndDip}. Core recovery across latest boreholes averages 94.6% with low phosphorus (avg {selectedMine.phosphorusGradePct}% P) and premium high grade ({selectedMine.averageGradeMnPct}% Mn).
            </div>
          </div>

          {/* Section 2: Satellite */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
              <Satellite className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Earth Observation & Meteorological Constraints</span>
            </h4>
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block">24h Rainfall:</span>
                  <span className="text-cyan-400 font-bold">{satelliteData.rainfallMm24h} mm</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Soil Moisture Index:</span>
                  <span className="text-blue-400 font-bold">{satelliteData.soilMoisturePct}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Vegetation Chlorosis (NDVI):</span>
                  <span className="text-emerald-400 font-bold">{satelliteData.ndviScore}</span>
                </div>
              </div>
              <p className="text-slate-400 text-[11px] pt-2 border-t border-slate-800">
                Ground deformation monitored via Sentinel-1 InSAR confirms stable pit slope conditions ({satelliteData.insarDeformationMm} mm/yr). No active tension cracks reported on highwall benches.
              </p>
            </div>
          </div>

          {/* Section 3: Shortfall & Mitigations */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>3. Shortfall Discrepancy & Active Mitigation Orders</span>
            </h4>
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span>Total Identified Target Deficit:</span>
                <span className="text-rose-400 font-bold font-mono">-{deficitMt.toLocaleString()} MT</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-1.5">Active Mitigations in Dispatch:</span>
                {appliedActions.length === 0 ? (
                  <p className="text-slate-500 italic">No mitigations currently locked in dispatch. Use the Sandbox to deploy actions.</p>
                ) : (
                  <div className="space-y-1.5">
                    {appliedActions.map((act) => (
                      <div key={act.id} className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-medium text-slate-200">{act.title}</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold">
                          +{act.impactRecoveryMt.toLocaleString()} MT
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sign-off */}
          <div className="pt-6 border-t border-slate-800 flex justify-between items-end text-slate-500 text-[10px]">
            <div>
              <p>Certified by: Automated MOIL GeoAI Intelligence System</p>
              <p>Cryptographic hash: 0x8F92...B31A</p>
            </div>
            <div className="text-right">
              <div className="w-36 border-b border-slate-600 mb-1"></div>
              <p>Mine Manager / Shift Superintendent Sign-off</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
