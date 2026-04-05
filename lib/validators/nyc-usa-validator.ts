// lib/validators/nyc-usa-validator.ts

interface Room {
  id: string;
  name: string;
  area: number;
  dimensions: { length: number; width: number };
  windows: number;
  doors: number;
  ceiling_height?: number;
}

interface Door {
  id: string;
  width: number;
  type?: string;
}

interface Window {
  id: string;
  width: number;
  height: number;
  room?: string;
  egress_compliant?: boolean;
}

interface Stair {
  id: string;
  width: number;
  rise: number;
  going: number;
  risers_count?: number;
  handrails?: string;
}

interface NYCAnalysis {
  metadata: {
    detected_location: string;
    scale: string;
    units: string;
  };
  rooms: Room[];
  openings: {
    entrance_doors: Door[];
    internal_doors: Door[];
    windows: Window[];
  };
  stairs: Stair[];
  circulation: {
    corridors: any[];
    landings: any[];
  };
  means_of_escape: {
    travel_distance_to_exit: number;
    exits_count: number;
  };
  site_info: {
    plot_area: number;
    building_footprint: number;
    setbacks?: {
      front: number;
      side_left: number;
      side_right: number;
      rear: number;
    };
  };
  total_gfa: number;
  parking_spaces?: number;
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

export function validateNYC(analysis: NYCAnalysis, zoning: string = "R4") {
  const violations: Violation[] = [];
  const warnings: Warning[] = [];

  // ========================================
  // NYC BUILDING CODE 2022 - STAIRS
  // ========================================

  analysis.stairs?.forEach((stair, i) => {
    const stairId = stair.id || `S${i + 1}`;

    // Convert to inches for NYC code
    const riseInches = stair.rise * 12;
    const goingInches = stair.going * 12;
    const widthInches = stair.width * 12;

    // BC 1011.5.2: Riser height (4" min, 7.75" max for residential)
    if (riseInches > 7.75 || riseInches < 4) {
      violations.push({
        code: "NYC BC 1011.5.2",
        rule: "Stair riser height (residential)",
        found: `${riseInches.toFixed(2)}" (${stair.rise.toFixed(3)}')`,
        allowed: "4\" minimum, 7.75\" maximum",
        location: stairId,
        severity: "critical",
        reference: "NYC Building Code 2022, Section 1011.5.2",
      });
    }

    // BC 1011.5.2: Tread depth/going (10" min for residential)
    if (goingInches < 10) {
      violations.push({
        code: "NYC BC 1011.5.2",
        rule: "Stair tread depth (going, residential)",
        found: `${goingInches.toFixed(2)}" (${stair.going.toFixed(3)}')`,
        allowed: "10\" minimum",
        location: stairId,
        severity: "critical",
        reference: "NYC Building Code 2022, Section 1011.5.2",
      });
    }

    // BC 1011.2: Minimum stair width (44" for residential)
    if (widthInches < 44) {
      violations.push({
        code: "NYC BC 1011.2",
        rule: "Minimum stair width (residential, between handrails)",
        found: `${widthInches.toFixed(1)}" (${stair.width.toFixed(2)}')`,
        allowed: "44\" (3.67')",
        location: stairId,
        severity: "critical",
        reference: "NYC Building Code 2022, Section 1011.2",
      });
    }

    // BC 1014: Handrails required for 4+ risers
    if ((stair.risers_count || 0) >= 4 && !stair.handrails) {
      violations.push({
        code: "NYC BC 1014.1",
        rule: "Handrails required for stairs with 4+ risers",
        found: "No handrails detected",
        allowed: "At least one handrail required",
        location: stairId,
        severity: "major",
        reference: "NYC Building Code 2022, Section 1014",
      });
    }
  });

  // ========================================
  // NYC HOUSING MAINTENANCE CODE - ROOMS
  // ========================================

  analysis.rooms?.forEach((room) => {
    const roomName = room.name?.toLowerCase() || "";
    const roomId = room.name || room.id;

    // HMC §27-750: Minimum bedroom size (80 sqft)
    if (roomName.includes("bedroom")) {
      if (room.area < 80) {
        violations.push({
          code: "NYC HMC §27-750",
          rule: "Minimum bedroom floor area",
          found: `${room.area.toFixed(1)} sqft`,
          allowed: "80 sqft",
          location: roomId,
          severity: "major",
          reference: "NYC Housing Maintenance Code, Section 27-750",
        });
      }

      // HMC §27-749: Window requirement for bedrooms
      if (room.windows === 0) {
        violations.push({
          code: "NYC HMC §27-749",
          rule: "Window required in every bedroom for light and air",
          found: "0 windows",
          allowed:
            "≥1 window with area ≥10% of floor area, min 12 sqft, openable ≥6 sqft",
          location: roomId,
          severity: "critical",
          reference: "NYC Housing Maintenance Code, Section 27-749",
        });
      }
    }

    // HMC §27-749: Living room window
    if (roomName.includes("living") && room.windows === 0) {
      violations.push({
        code: "NYC HMC §27-749",
        rule: "Window required in living room",
        found: "0 windows",
        allowed: "≥1 window for natural light and ventilation",
        location: roomId,
        severity: "critical",
        reference: "NYC Housing Maintenance Code, Section 27-749",
      });
    }

    // HMC §27-750: Ceiling height (8' typical for habitable rooms)
    if (
      (roomName.includes("bedroom") || roomName.includes("living")) &&
      room.ceiling_height &&
      room.ceiling_height < 8
    ) {
      violations.push({
        code: "NYC HMC §27-750",
        rule: "Minimum ceiling height for habitable rooms",
        found: `${room.ceiling_height.toFixed(1)}'`,
        allowed: "8' (96 inches)",
        location: roomId,
        severity: "major",
        reference: "NYC Housing Maintenance Code, Section 27-750",
      });
    }
  });

  // ========================================
  // NYC ZONING RESOLUTION - FAR & COVERAGE
  // ========================================

  const far = analysis.total_gfa / analysis.site_info.plot_area;

  // Max FAR by zoning district
  const FAR_LIMITS: Record<string, number> = {
    R1: 0.5,
    R2: 0.5,
    R3: 0.6,
    "R3-1": 0.6,
    "R3-2": 0.6,
    "R3A": 0.6,
    "R3X": 0.6,
    R4: 0.75,
    "R4-1": 0.75,
    "R4A": 0.75,
    "R4B": 0.75,
    R5: 1.25,
    "R5A": 1.25,
    "R5B": 1.25,
    "R5D": 2.0,
    R6: 2.43,
    "R6A": 3.0,
    "R6B": 2.0,
    R7: 3.44,
    "R7A": 4.0,
    "R7B": 3.0,
    "R7D": 4.2,
    "R7X": 3.44,
    R8: 6.02,
    "R8A": 6.02,
    "R8B": 4.0,
    "R8X": 6.02,
    R9: 7.52,
    "R9A": 7.52,
    "R9X": 9.0,
    R10: 10.0,
    "R10A": 10.0,
  };

  const maxFAR = FAR_LIMITS[zoning.toUpperCase()] || 1.0;

  if (far > maxFAR) {
    violations.push({
      code: `NYC Zoning ${zoning.toUpperCase()}`,
      rule: "Maximum Floor Area Ratio (FAR)",
      found: far.toFixed(2),
      allowed: maxFAR.toFixed(2),
      severity: "critical",
      reference: `NYC Zoning Resolution, ${zoning.toUpperCase()} district regulations`,
    });
  }

  // Lot coverage (typical max 60-80% depending on district)
  const coverage =
    (analysis.site_info.building_footprint / analysis.site_info.plot_area) * 100;

  if (coverage > 80) {
    violations.push({
      code: `NYC Zoning ${zoning.toUpperCase()}`,
      rule: "Maximum lot coverage",
      found: `${coverage.toFixed(1)}%`,
      allowed: "Typically 60-80% depending on district",
      severity: "major",
      reference: `NYC Zoning Resolution, check ${zoning.toUpperCase()} specific requirements`,
    });
  }

  // ========================================
  // NYC ZONING - SETBACKS (typical R4 example)
  // ========================================

  if (analysis.site_info.setbacks) {
    const setbacks = analysis.site_info.setbacks;

    // These are illustrative for R4; adjust per actual zoning
    const REQUIRED_SETBACKS: Record<string, any> = {
      R4: { front: 10, side_total: 8, rear: 30 }, // feet
      R5: { front: 10, side_total: 8, rear: 30 },
      R6: { front: 10, side_total: 8, rear: 30 },
    };

    const required = REQUIRED_SETBACKS[zoning.toUpperCase()];

    if (required) {
      if (setbacks.front < required.front) {
        violations.push({
          code: `NYC Zoning ${zoning.toUpperCase()}`,
          rule: "Front yard setback",
          found: `${setbacks.front.toFixed(1)}'`,
          allowed: `${required.front}'`,
          severity: "major",
          reference: `NYC Zoning Resolution, ${zoning.toUpperCase()} yard requirements`,
        });
      }

      if (setbacks.rear < required.rear) {
        violations.push({
          code: `NYC Zoning ${zoning.toUpperCase()}`,
          rule: "Rear yard depth",
          found: `${setbacks.rear.toFixed(1)}'`,
          allowed: `${required.rear}'`,
          severity: "major",
          reference: `NYC Zoning Resolution, ${zoning.toUpperCase()} yard requirements`,
        });
      }
    }
  }

  // ========================================
  // NYC ZONING - PARKING (varies by district & location)
  // ========================================

  // Typical R4-R6: 1 space per dwelling unit (outside transit zones)
  const dwelling_units = analysis.rooms.filter((r) =>
    r.name.toLowerCase().includes("bedroom")
  ).length;

  if (
    analysis.parking_spaces !== undefined &&
    analysis.parking_spaces < dwelling_units
  ) {
    warnings.push({
      rule: "Parking requirement (typical for low-density residential)",
      found: `${analysis.parking_spaces} spaces`,
      recommended: `${dwelling_units} spaces (1 per unit)`,
      note: "Actual requirement varies by location and transit accessibility. Check ZR Section 25-20.",
    });
  }

  // ========================================
  // SUMMARY
  // ========================================

  return {
    jurisdiction: "New York City, USA",
    zoning_district: zoning.toUpperCase(),
    applicable_codes: [
      "NYC Building Code 2022",
      "NYC Zoning Resolution",
      "NYC Housing Maintenance Code",
    ],
    compliant: violations.length === 0,
    violations,
    warnings,
    metrics: {
      total_gfa_sqft: analysis.total_gfa,
      far: far.toFixed(2),
      lot_coverage_pct: coverage.toFixed(1),
      rooms_count: analysis.rooms?.length || 0,
      parking_spaces: analysis.parking_spaces || 0,
    },
  };
}
