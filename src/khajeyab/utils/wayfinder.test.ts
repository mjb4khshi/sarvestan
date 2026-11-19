import test from 'node:test';
import assert from 'node:assert/strict';
import {KNTU_CAMPUSES} from '../data/kntuCampuses';
import {
  buildDeepLink,
  buildExternalNavLinks,
  filterCampuses,
  findInterCampusRoute,
  formatDistanceKm,
  formatDurationMin,
  haversineKm,
  parseWayfinderParams,
  toPersianDigits,
} from './wayfinder';
import {parseOsrmResponse} from './osrmRouting';

test('toPersianDigits converts ASCII numerals accurately', () => {
  assert.equal(toPersianDigits('1234567890'), '۱۲۳۴۵۶۷۸۹۰');
  assert.equal(toPersianDigits('خط 3 مترو'), 'خط ۳ مترو');
});

test('filterCampuses finds rezaeinejad by aerospace faculty and zeinoddin', () => {
  const byAerospace = filterCampuses(KNTU_CAMPUSES, 'هوافضا');
  assert.equal(byAerospace.length, 1);
  assert.equal(byAerospace[0].id, 'rezaeinejad');

  const byArabicYeh = filterCampuses(KNTU_CAMPUSES, 'فيزيك');
  assert.ok(byArabicYeh.some((c) => c.id === 'rezaeinejad'));

  const byLine2 = filterCampuses(KNTU_CAMPUSES, '', 2);
  assert.equal(byLine2.length, 1);
  assert.equal(byLine2[0].id, 'rezaeinejad');
});

test('science campus includes advisory note pointing to rezaeinejad', () => {
  const science = KNTU_CAMPUSES.find((c) => c.id === 'science');
  assert.ok(science);
  assert.ok(science.importantNote && science.importantNote.includes('رضایی‌نژاد'));
});

test('findInterCampusRoute returns curated, reversed, and synthesized routes', () => {
  assert.equal(findInterCampusRoute('vanak', 'vanak'), null);

  const curated = findInterCampusRoute('seyyedkhandan', 'vanak');
  assert.ok(curated);
  assert.equal(curated.from, 'seyyedkhandan');
  assert.equal(curated.to, 'vanak');
  assert.ok(curated.steps.length >= 2);

  const reversed = findInterCampusRoute('vanak', 'seyyedkhandan');
  assert.ok(reversed);
  assert.equal(reversed.from, 'vanak');
  assert.equal(reversed.to, 'seyyedkhandan');

  const synthesized = findInterCampusRoute('central', 'rezaeinejad');
  assert.ok(synthesized);
  assert.ok(synthesized.estimatedMinutes >= 6);
  assert.ok(synthesized.steps.length >= 2);
});

test('distance and duration formatting produce clean Persian units', () => {
  assert.equal(formatDistanceKm(450), '۴۵۰ متر');
  assert.equal(formatDistanceKm(2450), '۲٫۵ کیلومتر');
  assert.equal(formatDurationMin(18), '۱۸ دقیقه');
  assert.equal(formatDurationMin(75), '۱ ساعت و ۱۵ دقیقه');
  const dist = haversineKm({lat: 35.7417, lng: 51.4488}, {lat: 35.7568, lng: 51.4045});
  assert.ok(dist > 3.5 && dist < 5.5);
});

test('deep link builder and parser handle custom domains and embed mode', () => {
  const link = buildDeepLink('khajeyab.ir/', 'rezaeinejad', true);
  assert.equal(link, 'https://khajeyab.ir/?dest=rezaeinejad&embed=1');

  const parsed = parseWayfinderParams('?dest=rezaeinejad&embed=1&theme=emerald&view=poster');
  assert.equal(parsed.dest, 'rezaeinejad');
  assert.equal(parsed.embed, true);
  assert.equal(parsed.theme, 'emerald');
  assert.equal(parsed.view, 'poster');

  const invalid = parseWayfinderParams('?dest=unknown&view=nope');
  assert.equal(invalid.dest, undefined);
  assert.equal(invalid.view, undefined);
  assert.equal(invalid.embed, false);
});

test('buildExternalNavLinks generates valid Google Maps, Neshan, and Balad URLs', () => {
  const links = buildExternalNavLinks({lat: 35.7417, lng: 51.4488}, 'پردیس سیدخندان');
  assert.ok(links.googleMaps.includes('35.741700,51.448800'));
  assert.ok(links.neshan.includes('nshn.ir'));
  assert.ok(links.balad.includes('balad.ir'));
});

test('parseOsrmResponse converts OSRM GeoJSON [lng, lat] to Leaflet [lat, lng] and rejects invalid payloads', () => {
  const valid = parseOsrmResponse({
    code: 'Ok',
    routes: [
      {
        distance: 4280.4,
        duration: 612.2,
        geometry: {
          type: 'LineString',
          coordinates: [
            [51.4488, 35.7417],
            [51.425, 35.751],
            [51.4045, 35.7568],
          ],
        },
      },
    ],
  });

  assert.ok(valid);
  assert.equal(valid.distanceMeters, 4280);
  assert.equal(valid.durationMillis, 612200);
  assert.equal(valid.isFallback, false);
  assert.deepEqual(valid.coordinates[0], [35.7417, 51.4488]);
  assert.deepEqual(valid.coordinates[2], [35.7568, 51.4045]);

  assert.equal(parseOsrmResponse({code: 'NoRoute', routes: []}), null);
  assert.equal(parseOsrmResponse({code: 'Ok', routes: [{geometry: {coordinates: [[51.4, 35.7]]}}]}), null);
});
