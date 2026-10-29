import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter, Layers, Navigation, RefreshCw } from 'lucide-react';

export default function LeafletMap({
  markers = [],
  selectedIncident = null,
  onSelectIncident = () => {},
  height = '460px',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [filter, setFilter] = useState('ALL');

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: India / South Asia geographic center
      const map = L.map(mapContainerRef.current, {
        center: [17.3850, 78.4867],
        zoom: 5,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Force recalculation of dimensions to avoid gray tile edges
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
      setTimeout(() => {
        map.invalidateSize();
      }, 600);
    }

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map markers whenever markers data or filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Invalidate size to ensure full container rendering
    map.invalidateSize();
    markersLayer.clearLayers();

    const filtered = markers.filter((m) => {
      const p = (m.priority || '').toLowerCase();
      if (filter === 'CRITICAL') return p === 'high' || (m.severityScore && m.severityScore >= 65) || (m.trapped && m.trapped > 0);
      if (filter === 'MEDIUM') return p === 'medium';
      if (filter === 'LOW') return p === 'low';
      if (filter === 'RESOLVED') return m.status === 'RESOLVED';
      return true;
    });

    const bounds = [];

    filtered.forEach((m) => {
      const lat = Number(m.latitude);
      const lng = Number(m.longitude);
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      bounds.push([lat, lng]);

      const priorityLower = (m.priority || '').toLowerCase();
      const isCritical = priorityLower === 'high' || (m.severityScore && m.severityScore >= 65) || (m.trapped && m.trapped > 0);
      const isResolved = m.status === 'RESOLVED';

      // Pin Color explicitly based on ML-evaluated priority
      let pinColor = '#0284c7'; // Blue for Low Priority
      let priorityLabel = 'LOW';
      let priorityBadgeBg = '#1e3a8a';
      let priorityTextColor = '#93c5fd';

      if (isResolved) {
        pinColor = '#10b981'; // Emerald Green
        priorityLabel = 'RESOLVED';
        priorityBadgeBg = '#064e3b';
        priorityTextColor = '#6ee7b7';
      } else if (isCritical) {
        pinColor = '#dc2626'; // Red for Critical / High Priority
        priorityLabel = 'HIGH / CRITICAL';
        priorityBadgeBg = '#7f1d1d';
        priorityTextColor = '#fca5a5';
      } else if (priorityLower === 'medium' || (m.severityScore && m.severityScore >= 40)) {
        pinColor = '#f59e0b'; // Amber / Orange for Medium Priority
        priorityLabel = 'MEDIUM';
        priorityBadgeBg = '#78350f';
        priorityTextColor = '#fde68a';
      } else {
        pinColor = '#0284c7'; // Blue for Low Priority
        priorityLabel = 'LOW';
        priorityBadgeBg = '#1e3a8a';
        priorityTextColor = '#93c5fd';
      }

      // Pin-style SVG icon with pointy tip anchoring directly to coordinate
      const iconSvg = `
        <div class="${isCritical ? 'pulse-pin' : ''}" style="width: 32px; height: 42px; position: relative;">
          <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
            <path d="M16 0C7.16 0 0 7.16 0 16C0 27.2 16 42 16 42C16 42 32 27.2 32 16C32 7.16 24.84 0 16 0Z" fill="${pinColor}"/>
            <circle cx="16" cy="15" r="7.5" fill="#ffffff"/>
            <circle cx="16" cy="15" r="4" fill="${pinColor}"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-pin-marker',
        html: iconSvg,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -38],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const statusBadgeColor = isResolved ? '#10b981' : isCritical ? '#ef4444' : '#f59e0b';

      const popupHtml = `
        <div style="font-family: 'DM Sans', sans-serif; min-width: 250px; max-width: 320px; color: #1e293b; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 800; color: #0284c7; letter-spacing: 0.5px;">${m.id || 'REPORT'}</span>
            <div style="display: flex; gap: 4px;">
              <span style="background: ${priorityBadgeBg}; color: ${priorityTextColor}; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                ${priorityLabel}
              </span>
              <span style="background: ${statusBadgeColor}; color: #fff; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                ${m.status ? m.status.replace('_', ' ') : 'RECEIVED'}
              </span>
            </div>
          </div>
          <h4 style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.3;">${m.title}</h4>
          <p style="margin: 0 0 6px; font-size: 12px; color: #475569;">
            <b>Location:</b> ${m.location} ${m.landmark ? '· (' + m.landmark + ')' : ''}
          </p>
          <div style="display: flex; gap: 8px; margin: 8px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; font-size: 11px;">
            <div><b style="color: #ef4444; font-size: 13px;">${m.trapped || 0}</b> Trapped</div>
            <div><b style="color: #f97316; font-size: 13px;">${m.injured || 0}</b> Injured</div>
            <div><b style="color: #0284c7; font-size: 13px;">${m.affected || 0}</b> Affected</div>
          </div>
          ${m.assignedTeam && m.assignedTeam !== 'Unassigned' ? `<div style="font-size: 11px; color: #0369a1; margin-bottom: 8px;"><b>Assigned Battalion:</b> ${m.assignedTeam}</div>` : ''}
          ${m.summary ? `<p style="font-size: 11px; color: #64748b; line-height: 1.4; margin: 0 0 10px;">${m.summary}</p>` : ''}
          <button id="btn-review-${m.id}" style="
            width: 100%;
            background: #0284c7;
            color: #ffffff;
            border: none;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 700;
            border-radius: 4px;
            cursor: pointer;
          ">
            Review Incident & Take Action →
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-review-${m.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectIncident(m);
          };
        }
      });

      markersLayer.addLayer(marker);
    });

    if (bounds.length > 0 && !selectedIncident) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [markers, filter]);

  // Center on selected incident
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedIncident) return;
    const lat = Number(selectedIncident.latitude);
    const lng = Number(selectedIncident.longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      map.flyTo([lat, lng], 13, { duration: 1.2 });
    }
  }, [selectedIncident]);

  return (
    <div
      className="leaflet-map-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #1e293b',
      }}
    >
      {/* Map Filter Controls Bar */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '6px',
          padding: '5px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
        }}
      >
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
          <Filter size={12} /> Priority Filter:
        </span>
        {[
          ['ALL', 'All Incidents'],
          ['CRITICAL', 'Critical / High (Red)'],
          ['MEDIUM', 'Medium (Orange)'],
          ['LOW', 'Low (Blue)'],
          ['RESOLVED', 'Resolved (Green)'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            style={{
              background: filter === key ? '#0284c7' : 'transparent',
              color: filter === key ? '#ffffff' : '#cbd5e1',
              border: filter === key ? '1px solid #38bdf8' : '1px solid transparent',
              padding: '4px 9px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Priority Color Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 1000,
          background: 'rgba(9, 24, 48, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #1e293b',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '11px',
          color: '#e2e8f0',
          boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
          ML Priority Indicators:
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626', display: 'inline-block', boxShadow: '0 0 6px #dc2626' }}></span>
          <span>Red: Critical / High Priority</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
          <span>Orange: Medium Priority</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7', display: 'inline-block' }}></span>
          <span>Blue: Low Priority</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          <span>Green: Action Resolved</span>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
