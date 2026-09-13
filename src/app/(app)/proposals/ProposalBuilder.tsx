"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { kw, kwh, num, pct, usd } from "@/lib/format";
import { FINANCING } from "@/lib/labels";
import type { PricingConstants } from "@/lib/lookups";
import type { Contact, FinancingKind, InverterSpec, PanelSpec } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, MetricTile } from "@/components/ui/Primitives";
import { AlertLine } from "@/components/ui/Primitives";
import {
  ChoiceCard,
  NumberInput,
  RangeInput,
  WizardField,
  WizardRail,
  type WizardStep,
} from "@/components/ui/Wizard";

const STEPS: WizardStep[] = [
  { key: "sizing", label: "System sizing", hint: "Roof area and how much of the bill to cover" },
  { key: "equipment", label: "Equipment", hint: "Panel and inverter from the catalog" },
  { key: "financing", label: "Financing", hint: "Cash, loan or lease" },
  { key: "summary", label: "Summary", hint: "What the customer sees" },
];

/** Usable watts per square foot of roof, allowing for setbacks and walkways. */
const WATTS_PER_SQFT = 15.5;

export function ProposalBuilder({
  panels,
  inverters,
  contacts,
  pricing,
}: {
  panels: PanelSpec[];
  inverters: InverterSpec[];
  contacts: Contact[];
  /** Rates and incentives the savings math assumes, served by the API. */
  pricing: PricingConstants;
}) {
  const { batteryPriceUsd, financingTerms, incentiveRates, kwhPerKwYear, utilityRateUsdPerKwh } =
    pricing;

  const [step, setStep] = useState(0);

  // Step 1
  const [contactId, setContactId] = useState("ct-018");
  const [roofArea, setRoofArea] = useState(720);
  const [targetOffset, setTargetOffset] = useState(95);
  const [monthlyBill, setMonthlyBill] = useState(254);

  // Step 2
  const [panelId, setPanelId] = useState(panels[0]?.id ?? "");
  const [inverterId, setInverterId] = useState(inverters[1]?.id ?? "");
  const [battery, setBattery] = useState(false);

  // Step 3
  const [financing, setFinancing] = useState<FinancingKind>("loan");

  const panel = panels.find((p) => p.id === panelId) ?? panels[0];
  const inverter = inverters.find((i) => i.id === inverterId) ?? inverters[0];
  const contact = contacts.find((c) => c.id === contactId);

  /** Everything downstream of the inputs, derived in one place. */
  const calc = useMemo(() => {
    const annualUsageKwh = (monthlyBill * 12) / utilityRateUsdPerKwh;
    const targetProduction = annualUsageKwh * (targetOffset / 100);

    // Size by demand, then clamp to what the roof can physically hold.
    const sizeByDemand = targetProduction / kwhPerKwYear;
    const sizeByRoof = (roofArea * WATTS_PER_SQFT) / 1000;
    const systemSizeKw = Math.min(sizeByDemand, sizeByRoof);
    const roofLimited = sizeByDemand > sizeByRoof;

    const panelCount = Math.max(1, Math.round((systemSizeKw * 1000) / panel.watts));
    const actualKw = (panelCount * panel.watts) / 1000;
    const annualProductionKwh = actualKw * kwhPerKwYear;
    const offsetAchievedPct = Math.round((annualProductionKwh / annualUsageKwh) * 100);

    // Cost: modules priced per watt, inverter per unit (micros are per module).
    const moduleCost = actualKw * 1000 * panel.pricePerWatt;
    const inverterCost =
      inverter.kind === "microinverter" ? inverter.price * panelCount : inverter.price;
    const batteryCost = battery ? batteryPriceUsd : 0;
    const grossCostUsd = Math.round(moduleCost + inverterCost + batteryCost);

    // Leases are third-party owned — the customer claims no credit.
    const eligibleForCredit = financing !== "lease";
    const federal = eligibleForCredit
      ? Math.round(grossCostUsd * (incentiveRates.federalCreditPct / 100))
      : 0;
    const state = eligibleForCredit ? incentiveRates.stateCreditUsd : 0;
    const incentivesUsd = federal + state;
    const netCostUsd = grossCostUsd - incentivesUsd;

    const annualUtilitySavings = annualProductionKwh * utilityRateUsdPerKwh;

    let monthlyPaymentUsd: number | null = null;
    let aprPct: number | null = null;
    let termYears: number | null = null;
    let annualSavingsUsd = annualUtilitySavings;

    if (financing === "loan") {
      aprPct = financingTerms.loan.aprPct;
      termYears = financingTerms.loan.termYears;
      const r = aprPct / 100 / 12;
      const n = termYears * 12;
      monthlyPaymentUsd = Math.round((netCostUsd * r) / (1 - Math.pow(1 + r, -n)));
      annualSavingsUsd = annualUtilitySavings - monthlyPaymentUsd * 12;
    } else if (financing === "lease") {
      aprPct = 0;
      termYears = financingTerms.lease.termYears;
      // Lease is priced as a share of the value delivered.
      monthlyPaymentUsd = Math.round((annualUtilitySavings * 0.79) / 12);
      annualSavingsUsd = annualUtilitySavings - monthlyPaymentUsd * 12;
    }

    const paybackYears =
      financing === "cash" && annualUtilitySavings > 0 ? netCostUsd / annualUtilitySavings : 0;

    const lifetimeSavingsUsd = Math.round(annualSavingsUsd * 25);

    return {
      annualUsageKwh,
      systemSizeKw: actualKw,
      roofLimited,
      panelCount,
      annualProductionKwh,
      offsetAchievedPct,
      grossCostUsd,
      incentivesUsd,
      netCostUsd,
      monthlyPaymentUsd,
      aprPct,
      termYears,
      annualSavingsUsd: Math.round(annualSavingsUsd),
      lifetimeSavingsUsd,
      paybackYears,
      eligibleForCredit,
    };
  }, [
    monthlyBill,
    targetOffset,
    roofArea,
    panel,
    inverter,
    battery,
    financing,
    batteryPriceUsd,
    financingTerms,
    incentiveRates,
    kwhPerKwYear,
    utilityRateUsdPerKwh,
  ]);

  const canAdvance = step < STEPS.length - 1;

  return (
    <div className="space-y-4">
      <Card>
        <WizardRail steps={STEPS} current={step} onJump={(i) => setStep(i)} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title={STEPS[step].label} meta={`Step ${step + 1} of ${STEPS.length}`} />

          <div className="px-4 py-4">
            {/* ── Step 1: sizing ─────────────────────────────────────── */}
            {step === 0 && (
              <>
                <WizardField label="Customer" htmlFor="pb-customer">
                  <select
                    id="pb-customer"
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="h-9 w-full max-w-sm rounded border border-rule-firm bg-surface px-2.5 text-sm text-ink"
                  >
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.address.city}
                      </option>
                    ))}
                  </select>
                </WizardField>

                <WizardField
                  label="Usable roof area"
                  hint="From the survey. We allow for setbacks and walkways, so this is the area we can actually cover."
                  htmlFor="pb-roof"
                >
                  <NumberInput
                    id="pb-roof"
                    value={roofArea}
                    onChange={setRoofArea}
                    min={100}
                    max={12000}
                    step={10}
                    suffix="sq ft"
                  />
                </WizardField>

                <WizardField
                  label="Current monthly bill"
                  hint="Drives how much production the customer actually needs."
                  htmlFor="pb-bill"
                >
                  <NumberInput
                    id="pb-bill"
                    value={monthlyBill}
                    onChange={setMonthlyBill}
                    min={40}
                    max={6000}
                    step={5}
                    suffix="$ / mo"
                  />
                </WizardField>

                <WizardField
                  label={`Target offset — ${pct(targetOffset)}`}
                  hint="How much of their annual usage the array should cover. Over 100% rarely pencils out under net billing."
                  htmlFor="pb-offset"
                >
                  <RangeInput
                    id="pb-offset"
                    value={targetOffset}
                    onChange={setTargetOffset}
                    min={40}
                    max={110}
                  />
                </WizardField>

                {calc.roofLimited && (
                  <AlertLine tone="warn">
                    The roof caps this system before the offset target does. At {num(roofArea)} sq ft
                    the most we fit is {kw(calc.systemSizeKw)}, which covers{" "}
                    {pct(calc.offsetAchievedPct)} of their usage.
                  </AlertLine>
                )}
              </>
            )}

            {/* ── Step 2: equipment ──────────────────────────────────── */}
            {step === 1 && (
              <>
                <WizardField label="Panel" hint="Module choice sets the panel count and most of the cost.">
                  <div className="space-y-2">
                    {panels.map((p) => (
                      <ChoiceCard
                        key={p.id}
                        selected={p.id === panelId}
                        onSelect={() => setPanelId(p.id)}
                        title={`${p.make} ${p.model}`}
                        subtitle={`${p.watts} W · ${pct(p.efficiencyPct, 1)} efficient · ${p.warrantyYears}-year warranty`}
                        right={`$${num(p.pricePerWatt, 2)}/W`}
                        note={p.note}
                      />
                    ))}
                  </div>
                </WizardField>

                <WizardField label="Inverter" hint="Microinverters cost more but handle shading and multiple roof planes.">
                  <div className="space-y-2">
                    {inverters.map((i) => (
                      <ChoiceCard
                        key={i.id}
                        selected={i.id === inverterId}
                        onSelect={() => setInverterId(i.id)}
                        title={`${i.make} ${i.model}`}
                        subtitle={`${i.kind === "microinverter" ? "Per module" : `${i.capacityKw} kW`} · ${pct(i.efficiencyPct, 1)} · ${i.warrantyYears}-year warranty`}
                        right={
                          i.kind === "microinverter"
                            ? `${usd(i.price)} ea`
                            : usd(i.price)
                        }
                        note={i.note}
                      />
                    ))}
                  </div>
                </WizardField>

                <WizardField label="Battery storage">
                  <ChoiceCard
                    selected={battery}
                    onSelect={() => setBattery(!battery)}
                    title="Add battery backup"
                    subtitle="13.5 kWh usable — covers the essentials through an evening outage"
                    right={usd(batteryPriceUsd)}
                    note={
                      inverter.kind === "hybrid"
                        ? "The selected inverter is battery-ready, so no extra hardware is needed."
                        : "Heads up: this inverter is not battery-ready. Switch to the Northgate hybrid if the customer wants backup."
                    }
                  />
                </WizardField>
              </>
            )}

            {/* ── Step 3: financing ──────────────────────────────────── */}
            {step === 2 && (
              <>
                <WizardField label="How is the customer paying?">
                  <div className="space-y-2">
                    {(["cash", "loan", "lease"] as FinancingKind[]).map((kind) => (
                      <ChoiceCard
                        key={kind}
                        selected={financing === kind}
                        onSelect={() => setFinancing(kind)}
                        title={FINANCING[kind].label}
                        subtitle={
                          kind === "cash"
                            ? "Pays up front, claims the credits, best lifetime return"
                            : kind === "loan"
                              ? `${num(financingTerms.loan.aprPct, 2)}% APR over ${financingTerms.loan.termYears} years — they own it and claim the credits`
                              : `${financingTerms.lease.termYears}-year term — we own it, no credits for them, no money down`
                        }
                        note={
                          kind === "lease"
                            ? "Third-party owned, so the 30% federal credit stays with us and is already priced in."
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </WizardField>

                {!calc.eligibleForCredit && (
                  <AlertLine tone="info">
                    On a lease the customer claims no tax credit — the incentive line drops to zero
                    and the monthly payment carries the value instead.
                  </AlertLine>
                )}
              </>
            )}

            {/* ── Step 4: summary ────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted">Proposal for</p>
                  <p className="text-xl font-semibold text-ink">{contact?.name}</p>
                  <p className="tnum text-sm text-muted">
                    {contact?.address.street}, {contact?.address.city} {contact?.address.state} ·{" "}
                    {contact?.utility}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MetricTile label="System size" value={num(calc.systemSizeKw, 1)} unit="kW" />
                  <MetricTile label="Panels" value={calc.panelCount} unit={`× ${panel.watts}W`} />
                  <MetricTile
                    label="Annual production"
                    value={num(Math.round(calc.annualProductionKwh))}
                    unit="kWh"
                  />
                  <MetricTile
                    label="Bill offset"
                    value={pct(calc.offsetAchievedPct)}
                    tone={calc.offsetAchievedPct >= targetOffset - 3 ? "ok" : "warn"}
                  />
                </div>

                <div className="overflow-hidden rounded border border-rule">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-rule">
                      <tr>
                        <td className="px-3 py-2 text-ink-soft">Equipment and installation</td>
                        <td className="tnum px-3 py-2 text-right text-ink">
                          {usd(calc.grossCostUsd)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-ink-soft">
                          Incentives{" "}
                          <span className="text-micro text-muted">
                            ({calc.eligibleForCredit
                              ? `${incentiveRates.federalCreditPct}% federal + state`
                              : "not available on a lease"})
                          </span>
                        </td>
                        <td className="tnum px-3 py-2 text-right text-ok">
                          {calc.incentivesUsd > 0 ? `− ${usd(calc.incentivesUsd)}` : usd(0)}
                        </td>
                      </tr>
                      <tr className="bg-canvas-sunk/60">
                        <td className="px-3 py-2.5 font-semibold text-ink">Net cost</td>
                        <td className="tnum px-3 py-2.5 text-right text-lg font-semibold text-ink">
                          {usd(calc.netCostUsd)}
                        </td>
                      </tr>
                      {calc.monthlyPaymentUsd !== null && (
                        <tr>
                          <td className="px-3 py-2 text-ink-soft">
                            Monthly payment
                            {calc.termYears ? (
                              <span className="tnum text-micro text-muted">
                                {" "}
                                ({calc.termYears} years
                                {calc.aprPct ? ` at ${num(calc.aprPct, 2)}% APR` : ""})
                              </span>
                            ) : null}
                          </td>
                          <td className="tnum px-3 py-2 text-right text-ink">
                            {usd(calc.monthlyPaymentUsd)}/mo
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <MetricTile
                    label="First-year savings"
                    value={usd(calc.annualSavingsUsd)}
                    tone={calc.annualSavingsUsd > 0 ? "ok" : "warn"}
                  />
                  <MetricTile label="25-year savings" value={usd(calc.lifetimeSavingsUsd)} />
                  <MetricTile
                    label="Payback"
                    value={calc.paybackYears > 0 ? num(calc.paybackYears, 1) : "—"}
                    unit={calc.paybackYears > 0 ? "years" : undefined}
                    hint={calc.paybackYears > 0 ? undefined : "Financed — savings start day one"}
                  />
                </div>

                <AlertLine tone="info">
                  Savings assume {utilityRateUsdPerKwh.toFixed(3)} $/kWh today and{" "}
                  {num(3.1, 1)}% annual utility escalation. Numbers are an estimate, not a
                  guarantee — say that out loud when you present it.
                </AlertLine>
              </div>
            )}
          </div>

          <footer className="flex items-center gap-2 border-t border-rule bg-canvas-sunk/40 px-4 py-3">
            <Button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft className="size-4" strokeWidth={2} />
              Back
            </Button>
            {canAdvance ? (
              <Button variant="primary" onClick={() => setStep((s) => s + 1)}>
                Next: {STEPS[step + 1].label}
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </Button>
            ) : (
              <>
                <Button variant="primary">
                  <Send className="size-4" strokeWidth={2.25} />
                  Send to customer
                </Button>
                <Button>Save as draft</Button>
              </>
            )}
            <span className="tnum ml-auto text-tiny text-muted">
              {kw(calc.systemSizeKw)} · {usd(calc.netCostUsd)} net
            </span>
          </footer>
        </Card>

        {/* Live running total — always visible while building */}
        <Card className="self-start">
          <CardHeader title="Running numbers" />
          <dl className="divide-y divide-rule px-4 py-1">
            <Row label="Annual usage" value={kwh(Math.round(calc.annualUsageKwh))} />
            <Row label="System size" value={kw(calc.systemSizeKw)} />
            <Row label="Panel count" value={`${calc.panelCount} × ${panel.watts}W`} />
            <Row label="Production" value={kwh(Math.round(calc.annualProductionKwh))} />
            <Row label="Offset" value={pct(calc.offsetAchievedPct)} />
            <Row label="Gross cost" value={usd(calc.grossCostUsd)} />
            <Row label="Incentives" value={usd(calc.incentivesUsd)} />
            <Row label="Net cost" value={usd(calc.netCostUsd)} strong />
            {calc.monthlyPaymentUsd !== null && (
              <Row label="Monthly" value={`${usd(calc.monthlyPaymentUsd)}/mo`} />
            )}
          </dl>
          <div className="border-t border-rule px-4 py-3">
            <p className="text-tiny leading-relaxed text-muted">
              {panel.make} {panel.model} with {inverter.make} {inverter.model}
              {battery ? ", plus battery backup" : ""}.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-tiny text-muted">{label}</dt>
      <dd
        className={
          strong ? "tnum text-sm font-semibold text-ink" : "tnum text-sm text-ink-soft"
        }
      >
        {value}
      </dd>
    </div>
  );
}
