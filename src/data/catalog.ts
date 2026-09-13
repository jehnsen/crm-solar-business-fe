import type { InverterSpec, PanelSpec } from "@/lib/types";

/** Mock equipment catalog used by step 2 of the proposal builder. */
export const panels: PanelSpec[] = [
  {
    id: "pn-001",
    make: "Meridian",
    model: "M-400 All-Black",
    watts: 400,
    efficiencyPct: 20.8,
    warrantyYears: 25,
    pricePerWatt: 2.62,
    note: "House standard. Black backsheet, best stock on hand.",
  },
  {
    id: "pn-002",
    make: "Meridian",
    model: "M-440 HD",
    watts: 440,
    efficiencyPct: 21.9,
    warrantyYears: 25,
    pricePerWatt: 2.78,
    note: "Fewer modules for the same target — good on tight roof planes.",
  },
  {
    id: "pn-003",
    make: "Helios",
    model: "HX-455 Bifacial",
    watts: 455,
    efficiencyPct: 22.6,
    warrantyYears: 30,
    pricePerWatt: 3.04,
    note: "Premium tier. Worth it on flat commercial roofs with white membrane.",
  },
  {
    id: "pn-004",
    make: "Cardinal",
    model: "CP-375",
    watts: 375,
    efficiencyPct: 19.4,
    warrantyYears: 20,
    pricePerWatt: 2.34,
    note: "Value option when the customer is payment-sensitive.",
  },
  {
    id: "pn-005",
    make: "Helios",
    model: "HX-500 Commercial",
    watts: 500,
    efficiencyPct: 22.1,
    warrantyYears: 25,
    pricePerWatt: 2.55,
    note: "Commercial only — 72-cell, needs the taller racking.",
  },
];

export const inverters: InverterSpec[] = [
  {
    id: "iv-001",
    make: "Volterra",
    model: "VX-7.6 String",
    kind: "string",
    capacityKw: 7.6,
    efficiencyPct: 97.5,
    warrantyYears: 12,
    price: 1980,
    note: "Cheapest path on an unshaded single-plane roof.",
  },
  {
    id: "iv-002",
    make: "Volterra",
    model: "VX-11.4 String",
    kind: "string",
    capacityKw: 11.4,
    efficiencyPct: 97.8,
    warrantyYears: 12,
    price: 2520,
    note: "Same family, sized for larger residential arrays.",
  },
  {
    id: "iv-003",
    make: "Lumen",
    model: "L-Micro 400",
    kind: "microinverter",
    capacityKw: 0.4,
    efficiencyPct: 96.9,
    warrantyYears: 25,
    price: 168,
    note: "Per-module. Pick this when there is real shading or many planes.",
  },
  {
    id: "iv-004",
    make: "Northgate",
    model: "NG-Hybrid 10",
    kind: "hybrid",
    capacityKw: 10,
    efficiencyPct: 97.2,
    warrantyYears: 15,
    price: 3640,
    note: "Battery-ready. Required if the customer wants backup later.",
  },
  {
    id: "iv-005",
    make: "Volterra",
    model: "VX-50 Commercial",
    kind: "string",
    capacityKw: 50,
    efficiencyPct: 98.4,
    warrantyYears: 10,
    price: 8900,
    note: "Three-phase, commercial service only.",
  },
];

export const batteryPriceUsd = 11_400;

/** Federal credit plus the state adder the office applies by default. */
export const incentiveRates = {
  federalCreditPct: 30,
  stateCreditUsd: 1000,
};

export const financingTerms = {
  loan: { aprPct: 6.49, termYears: 20 },
  lease: { aprPct: 0, termYears: 25, escalatorPct: 1.9 },
};

/** Blended utility rate the savings math assumes, $/kWh. */
export const utilityRateUsdPerKwh = 0.164;
export const utilityEscalationPct = 3.1;

/** Annual kWh produced per installed kW in this service territory. */
export const kwhPerKwYear = 1620;
