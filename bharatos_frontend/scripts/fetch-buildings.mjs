// Fetches real building footprints for Prayagraj (Naini / Sangam area) from
// OpenStreetMap's Overpass API and saves them as a static GeoJSON file that
// the map loads at runtime. Run this once (and re-run whenever you want to
// refresh the data or change the area) — do NOT call Overpass live from the
// browser on every page load; it's a shared public service with strict rate
// limits and outages are common.
//
// Usage:
//   node scripts/fetch-buildings.mjs
//
// Output:
//   public/data/buildings.geojson

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Bounding box around the Sangam / Naini / Civil Lines area of Prayagraj.
// Adjust these to widen/narrow the coverage. Format: south,west,north,east
const BBOX = '25.375,81.830,25.470,81.900';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

const QUERY = `
[out:json][timeout:60];
(
  way["building"](${BBOX});
  relation["building"](${BBOX});
);
out body;
>;
out skel qt;
`;

function estimateHeightMeters(tags) {
  if (tags.height) {
    const parsed = parseFloat(tags.height);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (tags['building:levels']) {
    const levels = parseFloat(tags['building:levels']);
    if (!Number.isNaN(levels)) return Math.max(3, levels * 3.2); // ~3.2m per storey
  }
  // Sensible fallback so untagged buildings (the vast majority in OSM for
  // most Indian cities) still render as a believable low-rise skyline.
  return 6 + Math.random() * 10;
}

function osmToGeoJSON(osm) {
  const nodesById = new Map();
  for (const el of osm.elements) {
    if (el.type === 'node') nodesById.set(el.id, [el.lon, el.lat]);
  }

  const features = [];
  for (const el of osm.elements) {
    if (el.type !== 'way' || !el.tags?.building) continue;
    const coords = el.nodes?.map((id) => nodesById.get(id)).filter(Boolean);
    if (!coords || coords.length < 4) continue; // need a closed ring

    features.push({
      type: 'Feature',
      properties: {
        id: el.id,
        height: estimateHeightMeters(el.tags),
        building_type: el.tags.building,
        name: el.tags.name ?? null,
      },
      geometry: { type: 'Polygon', coordinates: [coords] },
    });
  }
  return { type: 'FeatureCollection', features };
}

async function fetchFromOverpass() {
  let lastError;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`Trying ${endpoint} ...`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 65_000);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          // Overpass returns 406 for requests missing these — it's picky
          // about identifying the client and what it'll accept back.
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'BharatOS-FloodSim/1.0 (contact: dev@bharatos.local)',
        },
        body: 'data=' + encodeURIComponent(QUERY),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}${bodyText ? ` — ${bodyText.slice(0, 200)}` : ''}`);
      }
      return await res.json();
    } catch (err) {
      console.warn(`  failed: ${err.message}`);
      lastError = err;
    }
  }
  throw lastError ?? new Error('All Overpass endpoints failed');
}

async function main() {
  const osmData = await fetchFromOverpass();
  const geojson = osmToGeoJSON(osmData);
  console.log(`Fetched ${geojson.features.length} building footprints.`);

  const outDir = path.join(process.cwd(), 'public', 'data');
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, 'buildings.geojson');
  await writeFile(outPath, JSON.stringify(geojson));
  console.log(`Saved to ${outPath}`);
}

main().catch((err) => {
  console.error('Failed to fetch building data:', err.message);
  console.error('The map will fall back to procedurally generated buildings until this succeeds.');
  process.exit(1);
});
