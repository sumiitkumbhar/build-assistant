// lib/validators/london-uk-validator.ts

interface Room {
  id: string;
  name: string;
  area: number;
  dimensions: { length: number; width: number };
  windows: number;
  doors: number;
}

interface Door {
  id: string;
  width: number;
  type?: string;
  accessible?: boolean;
}

interface Stair {
  id: string;
  width: number;
  rise: number;
  going: number;
  risers_count?: number;
  handrails?: string;
}

interface Corridor {
  id: string;
  width: number;
  length: number;
}

interface LondonAnalysis {
  metadata: {
    detected_location: string;
    scale: string;
    units: string;
  };
  rooms: Room[];
  openings: {
    entrance_doors: Door[];
    internal_doors: Door[];
    windows: any[];
  };
  stairs: Stair[];
  circulation: {
    corridors: Corridor[];
    landings: any[];
  };
  means_of_escape: {
    travel_distance_to_exit: number;
    exits_count: number;
  };
  site_info: {
    plot_area: number;
    building_footprint: number;
    coverage_percent?: number;
  };
  total_gfa: number;
}

interface Violation {
  code: string;
  rule: string;
  found: string;
  allowed: string;
  location?: string;
  severity: "critical" | "major" | "minor";
  reference: string;
}

interface Warning {
  rule: string;
  found: string;
  typical?: string;
  recommended?: string;
  note: string;
}

export function validateLondon(analysis: LondonAnalysis) {
  const violations: Violation[] = [];
  const warnings: Warning[] = [];

  // ========================================
  // UK BUILDING REGULATIONS PART B - FIRE SAFETY
  // ========================================

  // B1: Travel distance to exit (residential)
  if (analysis.means_of_escape?.travel_distance_to_exit > 18) {
    violations.push({
      code: "UK BR Part B1",
      rule: "Maximum travel distance to nearest exit (single direction)",
      found: `${analysis.means_of_escape.travel_distance_to_exit.toFixed(1)}m`,
      allowed: "18m (one direction) or 45m (alternative exits available)",
      severity: "critical",
      reference: "Approved Document B, Section 3, Table 1",
    });
  }

  // B1: Minimum number of exits
  if (analysis.total_gfa > 60 && analysis.means_of_escape?.exits_count < 2) {
    violations.push({
      code: "UK BR Part B1",
      rule: "Minimum exits for dwelling >60m²",
      found: `${analysis.means_of_escape?.exits_count || 1} exit(s)`,
      allowed: "2 exits minimum",
      severity: "critical",
      reference: "Approved Document B, Section 3.6",
    });
  }

  // ========================================
  // UK BUILDING REGULATIONS PART K - STAIRS
  // ========================================

  analysis.stairs?.forEach((stair, i) => {
    const stairId = stair.id || `S${i + 1}`;

    // K1: Rise + Going rule (550mm ≤ 2R + G ≤ 700mm)
    const rise_mm = stair.rise * 1000;
    const going_mm = stair.going * 1000;
    const sum_2R_G = 2 * rise_mm + going_mm;

    if (sum_2R_G < 550 || sum_2R_G > 700) {
      violations.push({
        code: "UK BR Part K1",
        rule: "Stair pitch rule: 2×Rise + Going = 550-700mm",
        found: `${sum_2R_G.toFixed(0)}mm (R=${rise_mm.toFixed(0)}mm, G=${going_mm.toFixed(0)}mm)`,
        allowed: "550-700mm",
        location: stairId,
        severity: "critical",
        reference: "Approved Document K, Section 1.2, Diagram 1.1",
      });
    }

    // K1: Maximum rise
    if (rise_mm > 220) {
      violations.push({
        code: "UK BR Part K1",
        rule: "Maximum stair riser height (private stair)",
        found: `${rise_mm.toFixed(0)}mm (${stair.rise.toFixed(3)}m)`,
        allowed: "220mm",
        location: stairId,
        severity: "critical",
        reference: "Approved Document K, Section 1.2",
      });
    }

    // K1: Minimum going
    if (going_mm < 220) {
      violations.push({
        code: "UK BR Part K1",
        rule: "Minimum stair going (tread depth, private stair)",
        found: `${going_mm.toFixed(0)}mm (${stair.going.toFixed(3)}m)`,
        allowed: "220mm",
        location: stairId,
        severity: "critical",
        reference: "Approved Document K, Section 1.2",
      });
    }

    // K1: Minimum stair width
    if (stair.width < 0.9) {
      violations.push({
        code: "UK BR Part K1",
        rule: "Minimum stair width (private stair)",
        found: `${(stair.width * 1000).toFixed(0)}mm (${stair.width.toFixed(2)}m)`,
        allowed: "900mm",
        location: stairId,
        severity: "critical",
        reference: "Approved Document K, Section 1.3",
      });
    }

    // K1: Handrails
    if (stair.width >= 1.0 && stair.handrails !== "both_sides") {
      warnings.push({
        rule: "Stair handrails (width ≥1m)",
        found: stair.handrails || "unknown",
        recommended: "both_sides",
        note: `${stairId}: Stairs ≥1m wide should have handrails on both sides (Part K)`,
      });
    }
  });

  // ========================================
  // UK BUILDING REGULATIONS PART M - ACCESS
  // ========================================

  // M4(1): Entrance door width
  analysis.openings?.entrance_doors?.forEach((door, i) => {
    const doorId = door.id || `D${i + 1}`;
    if (door.width < 0.775) {
      violations.push({
        code: "UK BR Part M4(1)",
        rule: "Minimum clear opening width for entrance door",
        found: `${(door.width * 1000).toFixed(0)}mm (${door.width.toFixed(3)}m)`,
        allowed: "775mm",
        location: doorId,
        severity: "critical",
        reference: "Approved Document M, Section 2, Diagram 2.1",
      });
    }
  });

  // M4(1): Internal door width (habitable rooms)
  analysis.openings?.internal_doors?.forEach((door, i) => {
    const doorId = door.id || `ID${i + 1}`;
    if (door.width < 0.75) {
      warnings.push({
        rule: "Internal door width (Part M4(1) recommendation)",
        found: `${(door.width * 1000).toFixed(0)}mm`,
        recommended: "750mm minimum for accessible routes",
        note: `${doorId}: Below recommended width for accessible dwellings`,
      });
    }
  });

  // M4(1): Corridor width
  analysis.circulation?.corridors?.forEach((corridor, i) => {
    const corrId = corridor.id || `C${i + 1}`;
    if (corridor.width < 0.9) {
      warnings.push({
        rule: "Corridor width (Part M4(1) recommendation)",
        found: `${(corridor.width * 1000).toFixed(0)}mm`,
        recommended: "900mm minimum",
        note: `${corrId}: Below recommended width for accessible circulation`,
      });
    }
  });

  // ========================================
  // LONDON PLAN 2021 - SPACE STANDARDS
  // ========================================

  analysis.rooms?.forEach((room) => {
    const roomName = room.name?.toLowerCase() || "";

    if (roomName.includes("bedroom")) {
      const isDouble =
        roomName.includes("double") || roomName.includes("master") || room.area > 10;
      const minArea = isDouble ? 11.5 : 7.5;

      if (room.area < minArea) {
        violations.push({
          code: "London Plan 2021",
          rule: `Minimum ${isDouble ? "double" : "single"} bedroom size`,
          found: `${room.area.toFixed(1)} m²`,
          allowed: `${minArea} m²`,
          location: room.name || room.id,
          severity: "major",
          reference: "London Plan Policy D6, Table 3.1",
        });
      }
    }

    // Living room minimum
    if (roomName.includes("living") && room.area < 11.0) {
      warnings.push({
        rule: "Living room size (London Plan guidance)",
        found: `${room.area.toFixed(1)} m²`,
        recommended: "11.0 m² minimum",
        note: `${room.name || room.id}: Below London Plan recommended size`,
      });
    }

    // Natural light requirement (habitable rooms)
    if (
      (roomName.includes("bedroom") || roomName.includes("living")) &&
      room.windows === 0
    ) {
      violations.push({
        code: "UK BR Part F/London Plan",
        rule: "Habitable room must have window for natural light and ventilation",
        found: "0 windows",
        allowed: "≥1 window",
        location: room.name || room.id,
        severity: "critical",
        reference: "London Plan Policy D6 + Building Regulations Part F",
      });
    }
  });

  // ========================================
  // SITE COVERAGE & PLANNING
  // ========================================

  const coverage =
    (analysis.site_info?.building_footprint / analysis.site_info?.plot_area) * 100;

  if (coverage > 65) {
    warnings.push({
      rule: "Site coverage (typical planning)",
      found: `${coverage.toFixed(1)}%`,
      typical: "≤60-65% for residential (varies by London borough)",
      note: "High site coverage may require planning justification. Check local authority policy.",
    });
  }

  // ========================================
  // SUMMARY
  // ========================================

  return {
    jurisdiction: "London, UK",
    applicable_codes: [
      "UK Building Regulations 2010 (as amended)",
      "London Plan 2021",
      "Local borough planning policies",
    ],
    compliant: violations.length === 0,
    violations,
    warnings,
    metrics: {
      total_gfa_sqm: analysis.total_gfa,
      site_coverage_pct: coverage.toFixed(1),
      rooms_count: analysis.rooms?.length || 0,
      exits_count: analysis.means_of_escape?.exits_count || 0,
    },
  };
}
