"use client";

import AppShell from "@/components/layout/AppShell";
import { useEffect, useMemo, useState } from "react";

export default function LoanEligibilityPage() {
  const [state, setState] = useState("Odisha");
  const [landSize, setLandSize] = useState("");
  const [hasKYC, setHasKYC] = useState(true);
  const [hasBankAccount, setHasBankAccount] = useState(true);
  const [hasLandDocs, setHasLandDocs] = useState(true);
  const [existingLoan, setExistingLoan] = useState(false);

  useEffect(() => {
    const savedState =
      typeof window === "undefined"
        ? "Odisha"
        : localStorage.getItem("smartAgriState") || "Odisha";

    setState(savedState);
  }, []);

  const result = useMemo(() => {
    let score = 0;

    const land = Number(landSize || 0);
    if (land > 0) score += 25;
    if (land >= 1) score += 10;

    if (hasKYC) score += 25;
    if (hasBankAccount) score += 20;
    if (hasLandDocs) score += 20;

    if (existingLoan) score -= 15;

    if (score >= 75) return { score, level: "High", recommend: "Kisan Credit Card (KCC) / Crop Loan", color: "bg-green-50 text-green-700" };
    if (score >= 50) return { score, level: "Medium", recommend: "Try KCC with full documents / co-applicant", color: "bg-yellow-50 text-yellow-700" };
    return { score, level: "Low", recommend: "Improve documents + eligibility first", color: "bg-red-50 text-red-700" };
  }, [landSize, hasKYC, hasBankAccount, hasLandDocs, existingLoan]);

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Loan Eligibility Assessment</h1>
                <p className="mt-1 text-slate-600">
                  Simple AI-style assessment (rules-based) for crop loans/KCC readiness.
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${result.color}`}>
                Eligibility: {result.level} • Score {result.score}/100
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-lg font-bold text-slate-900">Your Details</div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-semibold text-slate-700">State</div>
                <select
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    localStorage.setItem("smartAgriState", e.target.value);
                  }}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                >
                  <option value="Odisha">Odisha</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                </select>
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-700">Land size (acres)</div>
                <input
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                  placeholder="e.g., 2"
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Check label="KYC documents ready (Aadhaar/PAN etc.)" checked={hasKYC} onChange={setHasKYC} />
              <Check label="Bank account available" checked={hasBankAccount} onChange={setHasBankAccount} />
              <Check label="Land/tenancy documents available" checked={hasLandDocs} onChange={setHasLandDocs} />
              <Check label="Existing loan already running" checked={existingLoan} onChange={setExistingLoan} />
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-lg font-bold text-slate-900">Recommendation</div>

            <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <b>Suggested:</b> {result.recommend}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm font-bold text-slate-900">Documents to keep ready</div>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>• Aadhaar (mandatory)</li>
                  <li>• Bank passbook + IFSC</li>
                  <li>• Land records / tenancy proof</li>
                  <li>• Passport photo</li>
                </ul>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm font-bold text-slate-900">Tips to increase approval</div>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>• Keep land/crop details clear</li>
                  <li>• Avoid missed repayments</li>
                  <li>• Apply with complete KYC</li>
                  <li>• Use crop plan to justify loan need</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              This is a guidance estimate. Final decision is by bank policies and verification.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 hover:bg-slate-50">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    </label>
  );
}
