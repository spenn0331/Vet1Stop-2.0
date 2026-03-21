'use client';

import { useLayoutEffect, useEffect, useRef } from 'react';
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
    <div style="font-family:sans-serif;font-size:12px;max-width:220px">
      <p style="font-weight:800;color:#1A2C5B;font-size:13px;margin:0 0 2px">${b.name}</p>
      <p style="color:#6b7280;margin:0 0 4px">${b.category} · ${b.city}, ${b.stateCode}</p>
      <p style="color:#374151;margin:0 0 6px;line-height:1.4">${b.description.slice(0, 100)}…</p>
      ${b.veteranDiscount ? `<p style="color:#b45309;font-weight:600;margin:0 0 4px">🎖️ ${b.veteranDiscount}</p>` : ''}
      <p style="color:#9ca3af;margin:0 0 6px">⭐ ${b.rating.toFixed(1)} (${b.reviewCount} reviews)</p>
      <a href="tel:${b.phone.replace(/\D/g, '')}" style="color:#1A2C5B;font-weight:700;text-decoration:none">📞 ${b.phone}</a>
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

    return () => {
      // Clear _leaflet_id BEFORE reappearLayoutEffects fires on remount
      map.remove();
      mapRef.current = null;
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
    <div
      ref={containerRef}
      style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
      aria-label="Veteran-owned business map"
      role="application"
    />
  );
}
