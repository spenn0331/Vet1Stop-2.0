'use client';

import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Business } from '@/data/businesses';
import { CATEGORY_ICONS } from '@/data/businesses';

// Fix default marker icon paths broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function makeIcon(category: Business['category'], featured: boolean): L.DivIcon {
  const emoji = CATEGORY_ICONS[category];
  const bg     = featured ? '#EAB308' : '#1A2C5B';
  const border = featured ? '#d97706' : '#2d4d99';
  return L.divIcon({
    className: '',
    html: `<div style="background:${bg};border:2px solid ${border};border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:32px;height:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.25)"><span style="transform:rotate(45deg);font-size:14px;line-height:1">${emoji}</span></div>`,
    iconSize:    [32, 32],
    iconAnchor:  [16, 32],
    popupAnchor: [0, -36],
  });
}

function makePopupHtml(b: Business): string {
  return `
    <div style="font-family:system-ui,sans-serif;font-size:12px;max-width:240px;padding:4px">
      <p style="font-weight:800;color:#1A2C5B;font-size:14px;margin:0 0 4px;line-height:1.3">${b.name}</p>
      <p style="color:#6b7280;margin:0 0 6px;font-size:11px">${b.category} · ${b.city}, ${b.stateCode}</p>
      <p style="color:#374151;margin:0 0 8px;line-height:1.5;font-size:12px">${b.description.slice(0, 120)}…</p>
      ${b.veteranDiscount ? `<p style="background:#FEF3C7;padding:4px 8px;border-radius:6px;color:#92400E;font-weight:600;margin:0 0 6px;font-size:11px">🎖️ ${b.veteranDiscount}</p>` : ''}
      <p style="color:#EAB308;margin:0 0 6px;font-size:11px">⭐ ${b.rating.toFixed(1)} <span style="color:#9ca3af">(${b.reviewCount} reviews)</span></p>
      <a href="tel:${b.phone.replace(/\D/g, '')}" style="color:#1A2C5B;font-weight:700;text-decoration:none;font-size:12px">📞 ${b.phone}</a>
    </div>`;
}

interface VOBMapProps {
  businesses: Business[];
  highlighted: Business | null;
  onSelect: (business: Business) => void;
}

export default function VOBMap({ businesses, highlighted, onSelect }: VOBMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markersRef   = useRef<L.Marker[]>([]);
  const [mapReady, setMapReady]  = useState(false);

  // ── Map initialisation — useLayoutEffect so cleanup runs before
  //    React 18 Strict Mode's reappearLayoutEffects, preventing the
  //    "Map container is already initialized" error. ──────────────
  useLayoutEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [38.5, -96.5],
      zoom: 4,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;
    map.whenReady(() => setMapReady(true));

    return () => {
      // Clear _leaflet_id BEFORE reappearLayoutEffects fires on remount
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // ── Sync markers whenever businesses list changes ─────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add new markers
    businesses.forEach(biz => {
      const marker = L.marker([biz.lat, biz.lng], { icon: makeIcon(biz.category, biz.featured) })
        .addTo(map)
        .bindPopup(makePopupHtml(biz), { maxWidth: 240 })
        .on('click', () => onSelect(biz));
      markersRef.current.push(marker);
    });
  }, [businesses, onSelect]);

  // ── Fly to highlighted business ───────────────────────────────
  useEffect(() => {
    if (highlighted && mapRef.current) {
      mapRef.current.flyTo([highlighted.lat, highlighted.lng], 13, { duration: 0.8 });
    }
  }, [highlighted]);

  return (
    <div className="relative" style={{ height: '100%', width: '100%' }}>
      {!mapReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100 rounded-2xl">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-[#1A2C5B] border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-500">Initializing map...</p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
        aria-label="Veteran-owned business map"
        role="application"
      />
    </div>
  );
}
