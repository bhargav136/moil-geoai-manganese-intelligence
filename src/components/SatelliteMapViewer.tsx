import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Satellite,
  Layers,
  Eye,
  Sliders,
  Maximize2,
  Info,
  Compass,
  AlertCircle,
  Sun,
  Droplet,
  Flame,
  Leaf,
  Sparkles,
  MapPin,
  ExternalLink,
  Target
} from 'lucide-react';
import { MineLocation } from '../types';
import { MINE_SATELLITE_DATA, MINE_BOREHOLES } from '../data/moilData';

interface SatelliteMapViewerProps {
  selectedMine: MineLocation;
}

export const SatelliteMapViewer: React.FC<SatelliteMapViewerProps> = ({ selectedMine }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Active satellite multi-spectral mode
  const [activeLayer, setActiveLayer] = useState<'rgb' | 'ndvi' | 'lst' | 'moisture' | 'swir' | 'insar'>('rgb');
  const [baseMapType, setBaseMapType] = useState<'satellite' | 'street' | 'dark'>('satellite');
  const [layerOpacity, setLayerOpacity] = useState<number>(0.75);
  const [showBoreholes, setShowBoreholes] = useState<boolean>(true);
  const [showConcessionBoundary, setShowConcessionBoundary] = useState<boolean>(true);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  const satelliteData = MINE_SATELLITE_DATA[selectedMine.id] || MINE_SATELLITE_DATA['balaghat'];
  const boreholes = MINE_BOREHOLES[selectedMine.id] || MINE_BOREHOLES['balaghat'] || [];

  // Safe coordinates extraction with fallbacks to avoid any undefined coordinates
  const rawLat = selectedMine?.coordinates?.lat ?? selectedMine?.latitude ?? 21.8129;
  const rawLng = selectedMine?.coordinates?.lng ?? selectedMine?.longitude ?? 80.1837;
  const centerLat = isNaN(Number(rawLat)) ? 21.8129 : Number(rawLat);
  const centerLng = isNaN(Number(rawLng)) ? 80.1837 : Number(rawLng);

  // Initialize and update the Leaflet map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Remove existing map instance if any and clear leftover _leaflet_id to avoid "Map container is already initialized"
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch {
        // ignore cleanup error
      }
      mapInstanceRef.current = null;
    }
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    try {
      const map = L.map(container, {
        center: [centerLat, centerLng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Add zoom control top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Track mouse coordinate
      map.on('mousemove', (e) => {
        setMouseCoords({
          lat: Number(e.latlng.lat.toFixed(5)),
          lng: Number(e.latlng.lng.toFixed(5)),
        });
      });

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;

      // Initial Base Tile Layer
      let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      let maxZoom = 19;
      if (baseMapType === 'street') {
        tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      } else if (baseMapType === 'dark') {
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
        maxZoom = 19;
      }

      const baseTile = L.tileLayer(tileUrl, {
        maxZoom,
        attribution: 'Esri, Maxar, Earthstar Geographics / MOIL GIS',
      }).addTo(map);
      tileLayerRef.current = baseTile;
    } catch (err) {
      console.error('Leaflet map initialization error:', err);
      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
      if (container && (container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }
    };
  }, []);

  // Update Base Tile Layer when baseMapType changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current && map.hasLayer(tileLayerRef.current)) {
      map.removeLayer(tileLayerRef.current);
    }

    let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let maxZoom = 19;

    if (baseMapType === 'street') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    } else if (baseMapType === 'dark') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 19;
    }

    const baseTile = L.tileLayer(tileUrl, {
      maxZoom,
      attribution: 'Esri, Maxar, Earthstar Geographics / MOIL GIS',
    });

    baseTile.addTo(map);
    tileLayerRef.current = baseTile;
  }, [baseMapType]);

  // Fly to mine when selectedMine changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && !isNaN(centerLat) && !isNaN(centerLng)) {
      map.flyTo([centerLat, centerLng], 15, {
        duration: 1.5,
      });
    }
  }, [centerLat, centerLng]);

  // Draw Geo Overlays (Mine Boundary, Boreholes, Multispectral Simulation Heatmaps)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Mine Lease Concession Polygon
    if (showConcessionBoundary) {
      const leasePoints: [number, number][] = [
        [centerLat + 0.009, centerLng - 0.012],
        [centerLat + 0.011, centerLng + 0.007],
        [centerLat + 0.003, centerLng + 0.014],
        [centerLat - 0.008, centerLng + 0.011],
        [centerLat - 0.009, centerLng - 0.008],
        [centerLat - 0.003, centerLng - 0.015],
      ];

      const leasePoly = L.polygon(leasePoints, {
        color: '#f59e0b',
        weight: 2,
        dashArray: '5, 5',
        fillColor: '#f59e0b',
        fillOpacity: 0.08,
      });

      leasePoly.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
          <strong style="color: #b45309; font-size: 13px;">${selectedMine.name} Mining Lease</strong><br/>
          Area: 384.5 Hectares<br/>
          Concession Grant: Active (Up to 2045)<br/>
          Formation: ${selectedMine.hostFormation}<br/>
          Avg Grade: <strong>${selectedMine.averageGradeMnPct}% Mn</strong>
        </div>
      `);
      leasePoly.addTo(layerGroup);

      // Active Pit / Underground Shaft Excavation Footprint
      const pitPoints: [number, number][] = [
        [centerLat + 0.003, centerLng - 0.005],
        [centerLat + 0.004, centerLng + 0.004],
        [centerLat - 0.002, centerLng + 0.005],
        [centerLat - 0.004, centerLng - 0.003],
      ];
      const pitPoly = L.polygon(pitPoints, {
        color: '#f43f5e',
        weight: 2,
        fillColor: '#f43f5e',
        fillOpacity: 0.18,
      });
      pitPoly.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
          <strong style="color: #e11d48;">Active Extraction Core (Pit / Shaft Sump)</strong><br/>
          Deepest Level: -320m RL<br/>
          Pumping Capacity: 1,200 m³/hr<br/>
          Status: Operational
        </div>
      `);
      pitPoly.addTo(layerGroup);
    }

    // 2. Multispectral Anomaly Layers
    if (activeLayer === 'ndvi') {
      // Vegetation Stress / Chlorosis Anomaly Zones (indicates shallow manganese ore outcropping)
      const ndviZones = [
        { lat: centerLat + 0.002, lng: centerLng + 0.003, radius: 280, val: 0.19, text: 'High Mn Outcrop Stress (NDVI: 0.19)' },
        { lat: centerLat - 0.001, lng: centerLng - 0.004, radius: 340, val: 0.24, text: 'Gondite Horizon Stress (NDVI: 0.24)' },
        { lat: centerLat + 0.005, lng: centerLng - 0.002, radius: 220, val: 0.58, text: 'Healthy Dense Canopy (NDVI: 0.58)' },
      ];

      ndviZones.forEach((z) => {
        const color = z.val < 0.3 ? '#ef4444' : z.val < 0.45 ? '#eab308' : '#22c55e';
        const circle = L.circle([z.lat, z.lng], {
          radius: z.radius,
          color,
          fillColor: color,
          fillOpacity: layerOpacity * 0.65,
          weight: 1.5,
        });
        circle.bindPopup(`<strong>${z.text}</strong><br/>Satellite: Sentinel-2 Multispectral`);
        circle.addTo(layerGroup);
      });
    } else if (activeLayer === 'lst') {
      // Land Surface Temperature (Thermal Inertia)
      const lstZones = [
        { lat: centerLat + 0.001, lng: centerLng + 0.001, radius: 320, temp: '36.8°C', note: 'Exposed Ore Body Thermal Signature' },
        { lat: centerLat - 0.003, lng: centerLng + 0.004, radius: 260, temp: '32.1°C', note: 'Moist Overburden Dump' },
      ];
      lstZones.forEach((z) => {
        const circle = L.circle([z.lat, z.lng], {
          radius: z.radius,
          color: '#f97316',
          fillColor: '#f97316',
          fillOpacity: layerOpacity * 0.6,
          weight: 1.5,
        });
        circle.bindPopup(`<strong>LST: ${z.temp}</strong><br/>${z.note}<br/>Landsat-9 TIRS Band 10`);
        circle.addTo(layerGroup);
      });
    } else if (activeLayer === 'moisture') {
      // Soil Moisture Saturation & Sump Water Accumulation
      const moistZones = [
        { lat: centerLat - 0.002, lng: centerLng - 0.001, radius: 300, level: '91% (Waterlogged Sump)', color: '#06b6d4' },
        { lat: centerLat + 0.003, lng: centerLng - 0.006, radius: 250, level: '58% (Moderate Infiltration)', color: '#3b82f6' },
      ];
      moistZones.forEach((z) => {
        const circle = L.circle([z.lat, z.lng], {
          radius: z.radius,
          color: z.color,
          fillColor: z.color,
          fillOpacity: layerOpacity * 0.65,
          weight: 1.5,
        });
        circle.bindPopup(`<strong>Soil Moisture: ${z.level}</strong><br/>SMAP & Sentinel-1 SAR`);
        circle.addTo(layerGroup);
      });
    } else if (activeLayer === 'swir') {
      // SWIR Manganese / Iron Hydroxide Ratio Anomaly
      const swirZones = [
        { lat: centerLat + 0.0015, lng: centerLng - 0.0015, radius: 360, ratio: '2.84 (High Braunite/Pyrolusite index)' },
        { lat: centerLat - 0.0035, lng: centerLng + 0.002, radius: 290, ratio: '2.41 (Psilomelane Lens)' },
      ];
      swirZones.forEach((z) => {
        const circle = L.circle([z.lat, z.lng], {
          radius: z.radius,
          color: '#a855f7',
          fillColor: '#a855f7',
          fillOpacity: layerOpacity * 0.65,
          weight: 1.5,
        });
        circle.bindPopup(`<strong>SWIR Absorption Ratio: ${z.ratio}</strong><br/>ASTER Band 4 / Band 7 ratio`);
        circle.addTo(layerGroup);
      });
    } else if (activeLayer === 'insar') {
      // Sentinel-1 InSAR Slope Displacement Points
      const insarPoints = [
        { lat: centerLat + 0.003, lng: centerLng + 0.002, disp: '-1.8 mm/yr', status: 'STABLE HIGHWALL' },
        { lat: centerLat - 0.002, lng: centerLng + 0.003, disp: '-4.2 mm/yr', status: 'MINOR SETTLEMENT BENCH 3' },
        { lat: centerLat - 0.004, lng: centerLng - 0.003, disp: '+0.4 mm/yr', status: 'STABLE DUMP FOOT' },
      ];
      insarPoints.forEach((p) => {
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: 9,
          color: '#38bdf8',
          fillColor: '#0284c7',
          fillOpacity: 0.9,
          weight: 2,
        });
        marker.bindPopup(`<strong>InSAR PS-InSAR Ground Motion:</strong><br/>Rate: <strong>${p.disp}</strong><br/>Classification: ${p.status}`);
        marker.addTo(layerGroup);
      });
    }

    // 3. Diamond Drill Borehole Collars with interactive popups
    if (showBoreholes) {
      boreholes.forEach((bh, idx) => {
        // Distribute coordinates realistically around mine center
        const offsetLat = (idx % 3 - 1) * 0.0032;
        const offsetLng = (Math.floor(idx / 3) - 1) * 0.0038;
        const bhLat = centerLat + offsetLat;
        const bhLng = centerLng + offsetLng;

        const collarMarker = L.circleMarker([bhLat, bhLng], {
          radius: 7,
          color: '#fbbf24',
          fillColor: bh.mnGradePct > 45 ? '#10b981' : '#f59e0b',
          fillOpacity: 1,
          weight: 2,
        });

        const popupContent = `
          <div style="font-family: sans-serif; font-size: 12px; min-width: 170px;">
            <div style="font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 4px;">
              Borehole Collar: ${bh.holeId}
            </div>
            <div>Depth: <strong>${bh.depthTo} m</strong></div>
            <div>Ore Intersection: <strong>${bh.depthFrom}m - ${bh.depthTo}m</strong></div>
            <div>Avg Mn Grade: <strong style="color: ${bh.mnGradePct > 45 ? '#059669' : '#d97706'}">${bh.mnGradePct}% Mn</strong></div>
            <div>Lithology: ${bh.lithology}</div>
            <div>Core Recovery: <strong>${bh.coreRecoveryPct}%</strong></div>
          </div>
        `;

        collarMarker.bindPopup(popupContent);
        collarMarker.on('click', () => {
          setSelectedFeature({
            type: 'borehole',
            data: bh,
            lat: bhLat,
            lng: bhLng,
          });
        });

        collarMarker.addTo(layerGroup);
      });
    }
  }, [
    activeLayer,
    baseMapType,
    layerOpacity,
    showBoreholes,
    showConcessionBoundary,
    selectedMine,
    boreholes,
  ]);

  return (
    <div className="space-y-4">
      {/* Top Banner & Layer Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Satellite className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Space Remote Sensing & Multi-Spectral Exploration Hub</h2>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-500/40">
              Live GIS Core
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real satellite imagery covering {selectedMine.name} ({selectedMine.district}, {selectedMine.state}) with Earth Observation overlays
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Base Map Switcher */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
            <button
              onClick={() => setBaseMapType('satellite')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                baseMapType === 'satellite' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setBaseMapType('dark')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                baseMapType === 'dark' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Night / Dark
            </button>
            <button
              onClick={() => setBaseMapType('street')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                baseMapType === 'street' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Topo / OSM
            </button>
          </div>

          <button
            onClick={() => {
              const map = mapInstanceRef.current;
              if (map && !isNaN(centerLat) && !isNaN(centerLng)) {
                map.flyTo([centerLat, centerLng], 15);
              }
            }}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 transition"
            title="Recenter Map on Active Mine"
          >
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>Recenter</span>
          </button>
        </div>
      </div>

      {/* Main Map Container + Floating Controls */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
        {/* The Real Leaflet Map DIV */}
        <div ref={mapContainerRef} className="w-full h-[540px] z-10" />

        {/* Top-Left Floating Spectral Overlay Selector */}
        <div className="absolute top-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-xl max-w-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-1.5">
            <span className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-Spectral Layer</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">EO Sentinel/Landsat</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              onClick={() => setActiveLayer('rgb')}
              className={`px-2 py-1.5 rounded-lg text-left transition flex items-center space-x-1.5 ${
                activeLayer === 'rgb'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Satellite className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">True Color (RGB)</span>
            </button>

            <button
              onClick={() => setActiveLayer('ndvi')}
              className={`px-2 py-1.5 rounded-lg text-left transition flex items-center space-x-1.5 ${
                activeLayer === 'ndvi'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">NDVI Chlorosis</span>
            </button>

            <button
              onClick={() => setActiveLayer('lst')}
              className={`px-2 py-1.5 rounded-lg text-left transition flex items-center space-x-1.5 ${
                activeLayer === 'lst'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Thermal LST</span>
            </button>

            <button
              onClick={() => setActiveLayer('moisture')}
              className={`px-2 py-1.5 rounded-lg text-left transition flex items-center space-x-1.5 ${
                activeLayer === 'moisture'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Droplet className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">Soil Moisture</span>
            </button>

            <button
              onClick={() => setActiveLayer('swir')}
              className={`px-2 py-1.5 rounded-lg text-left transition flex items-center space-x-1.5 ${
                activeLayer === 'swir'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">SWIR Mineral</span>
            </button>

            <button
              onClick={() => setActiveLayer('insar')}
              className={`px-2 py-1.5 rounded-lg text-left transition flex items-center space-x-1.5 ${
                activeLayer === 'insar'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">InSAR Stability</span>
            </button>
          </div>

          {/* Opacity Slider */}
          {activeLayer !== 'rgb' && (
            <div className="pt-2 border-t border-slate-800">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Layer Opacity:</span>
                <span className="font-mono text-cyan-400 font-bold">{Math.round(layerOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={layerOpacity}
                onChange={(e) => setLayerOpacity(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Top-Right Toggle Features */}
        <div className="absolute top-4 right-14 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-2.5 shadow-xl flex items-center space-x-3 text-xs">
          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showBoreholes}
              onChange={(e) => setShowBoreholes(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
            />
            <span>Borehole Collars</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showConcessionBoundary}
              onChange={(e) => setShowConcessionBoundary(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
            />
            <span>Lease Boundary</span>
          </label>
        </div>

        {/* Bottom Floating Bar: Coordinates & Active Telematics Readout */}
        <div className="absolute bottom-3 left-3 right-3 z-20 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-white">{selectedMine.name}</span>
              <span className="text-slate-500">|</span>
              <span className="font-mono text-slate-400">
                {mouseCoords ? `${mouseCoords.lat}° N, ${mouseCoords.lng}° E` : `${centerLat.toFixed(4)}° N, ${centerLng.toFixed(4)}° E`}
              </span>
            </div>

            <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono">
              <span className="text-slate-500">24h Rain:</span>
              <span className="text-cyan-400 font-bold">{satelliteData.rainfallMm24h} mm</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-500">NDVI Stress:</span>
              <span className="text-emerald-400 font-bold">{satelliteData.ndviScore}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-500">InSAR:</span>
              <span className="text-sky-400 font-bold">{satelliteData.insarDeformationMm} mm/yr</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
              Click pins or polygons to inspect
            </span>
          </div>
        </div>
      </div>

      {/* Selected Feature Card */}
      {selectedFeature && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between shadow-lg animate-fade-in">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <h4 className="font-bold text-white text-sm">
                Diamond Drill Core: {selectedFeature.data.holeId}
              </h4>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold font-mono">
                {selectedFeature.data.mnGradePct}% Mn Grade
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Depth: <strong>{selectedFeature.data.depthTo}m</strong> | Ore Intersect: <strong>{selectedFeature.data.depthFrom}m - {selectedFeature.data.depthTo}m</strong> ({selectedFeature.data.thicknessMeters}m true thickness) | Lithology: <strong>{selectedFeature.data.lithology}</strong>
            </p>
          </div>
          <button
            onClick={() => setSelectedFeature(null)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Scientific Satellite Index Description Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs mb-1">
            <Leaf className="w-4 h-4" />
            <span>NDVI Vegetation Stress</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            High heavy-metal soil concentrations (Mn/Fe) stunt surface vegetation canopy, producing distinct chlorosis anomalies (NDVI &lt; 0.25) directly above shallow subsurface ore lenses.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs mb-1">
            <Flame className="w-4 h-4" />
            <span>Thermal Inertia (LST)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Manganese oxides (braunite/pyrolusite) possess higher thermal diffusivity than surrounding mica-schists, remaining cooler during peak solar noon and retaining heat longer at dusk.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs mb-1">
            <Compass className="w-4 h-4" />
            <span>Sentinel-1 InSAR Stability</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Synthetic Aperture Radar interferometry tracks millimeter-scale pit highwall and overburden dump deformation, preventing slope failures before heavy haulage operations.
          </p>
        </div>
      </div>
    </div>
  );
};
