import { describe, it, expect } from 'vitest';
import { SECTORS, WATCHED_SECTORS, GA_SECTOR_ID, ALEBILET_EVENTS } from '../types';

describe('SECTORS', () => {
  it('contains all expected zones', () => {
    const zones = new Set(Object.values(SECTORS).map(s => s.zone));

    expect(zones).toContain('red');
    expect(zones).toContain('yellow');
    expect(zones).toContain('green');
    expect(zones).toContain('ga');
  });

  it('has unique sector names', () => {
    const names = Object.values(SECTORS).map(s => s.name);
    const uniqueNames = new Set(names);

    expect(uniqueNames.size).toBe(names.length);
  });

  it('has valid zone values for every sector', () => {
    const validZones = ['red', 'yellow', 'green', 'ga'];

    for (const sector of Object.values(SECTORS)) {
      expect(validZones).toContain(sector.zone);
    }
  });

  it('contains the GA sector', () => {
    expect(SECTORS[GA_SECTOR_ID]).toBeDefined();
    expect(SECTORS[GA_SECTOR_ID].zone).toBe('ga');
  });
});

describe('WATCHED_SECTORS', () => {
  it('only watches sectors that exist', () => {
    const allNames = Object.values(SECTORS).map(s => s.name);

    for (const watched of WATCHED_SECTORS) {
      expect(allNames).toContain(watched);
    }
  });
});

describe('ALEBILET_EVENTS', () => {
  it('has valid URLs', () => {
    for (const event of ALEBILET_EVENTS) {
      expect(event.url).toMatch(/^https:\/\//);
    }
  });

  it('has valid date IDs', () => {
    for (const event of ALEBILET_EVENTS) {
      expect(event.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
