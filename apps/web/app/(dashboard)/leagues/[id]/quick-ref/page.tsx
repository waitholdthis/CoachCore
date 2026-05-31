"use client";
import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Shield, Share2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { rulesApi, leaguesApi } from "@/lib/api";
import { formatCategory, SPORT_EMOJI, AGE_BRACKETS, DIVISION_TYPES } from "@/lib/utils";
import type { ActiveRule, QuickRefCard } from "@/lib/types";

export default function QuickRefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ageBracket, setAgeBracket] = useState("U10");
  const [divisionType, setDivisionType] = useState("recreational");
  const [tier2Expanded, setTier2Expanded] = useState(false);

  const { data: league } = useQuery({
    queryKey: ["league", id],
    queryFn: () => leaguesApi.get(id),
  });

  const { data: card, isLoading } = useQuery({
    queryKey: ["quick-ref", league?.sport, ageBracket, divisionType, id],
    queryFn: () =>
      rulesApi.quickRef({
        sport: league!.sport,
        age_bracket: ageBracket,
        division_type: divisionType,
        league_id: id,
      }),
    enabled: !!league,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {league ? SPORT_EMOJI[league.sport] : ""} Game-Day Quick Reference
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {league?.name} — Critical rules at a glance
          </p>
        </div>
        {card?.share_token && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/share/${card.share_token}`);
            }}
            className="flex items-center gap-2 text-sm text-brand-600 border border-brand-200 px-3 py-2 rounded-lg hover:bg-brand-50"
          >
            <Share2 size={14} /> Share with team
          </button>
        )}
      </div>

      {/* Context selectors */}
      <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
        <select
          value={ageBracket}
          onChange={e => setAgeBracket(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {AGE_BRACKETS.map(ab => <option key={ab} value={ab}>{ab}</option>)}
        </select>
        <select
          value={divisionType}
          onChange={e => setDivisionType(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {DIVISION_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
        </select>
        {isLoading && <span className="text-sm text-slate-400 animate-pulse">Loading rules...</span>}
      </div>

      {/* Safety flags */}
      {(card?.safety_flags?.length ?? 0) > 0 && (
        <div className="safety-banner">
          <Shield size={18} className="shrink-0" />
          <div>
            <strong>Safety rules active for {ageBracket}:</strong>{" "}
            {card!.safety_flags.map(r => formatCategory(r.category)).join(", ")}
          </div>
        </div>
      )}

      {/* Local overrides banner */}
      {(card?.local_override_count ?? 0) > 0 && (
        <div className="conflict-banner">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            <strong>{card!.local_override_count} local rule{card!.local_override_count > 1 ? "s" : ""}</strong>{" "}
            from your uploaded rulebook override the standard rules below.
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* Tier 1 — Always visible */}
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Critical — Need to know before kickoff
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {card?.tier_1.map(rule => (
                <Tier1Slot key={rule.id} rule={rule} />
              ))}
              {(!card?.tier_1 || card.tier_1.length === 0) && (
                <div className="col-span-2 text-center py-8 text-slate-400">
                  No critical rules found for {ageBracket} {divisionType}
                </div>
              )}
            </div>
          </div>

          {/* Tier 2 — Expandable */}
          {(card?.tier_2?.length ?? 0) > 0 && (
            <div>
              <button
                onClick={() => setTier2Expanded(!tier2Expanded)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 w-full"
              >
                {tier2Expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {tier2Expanded ? "Hide" : "Show"} additional rules ({card!.tier_2.length})
              </button>
              {tier2Expanded && (
                <div className="mt-3 space-y-2">
                  {card!.tier_2.map(rule => (
                    <Tier2Row key={rule.id} rule={rule} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Tier1Slot({ rule }: { rule: ActiveRule }) {
  const isLocal = rule.rule_tier === "local";
  return (
    <div className={`rounded-xl p-4 border-2 ${
      isLocal ? "bg-conflict-50 border-conflict-300" : "bg-brand-50 border-brand-200"
    }`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {formatCategory(rule.category)}
      </p>
      <p className="font-bold text-slate-900 text-lg leading-tight">
        {rule.numeric_value
          ? `${rule.numeric_value} ${rule.numeric_unit?.replace(/_/g, " ") ?? ""}`
          : rule.plain_language_text ?? rule.canonical_text
        }
      </p>
      {isLocal && (
        <p className="text-xs text-conflict-600 mt-1.5 font-medium">
          ⚠ Local override — see uploaded doc
          {rule.source_page && ` p.${rule.source_page}`}
        </p>
      )}
      {rule.safety_critical && (
        <p className="text-xs text-safety-600 mt-1 font-medium flex items-center gap-1">
          <Shield size={11} /> Safety rule
        </p>
      )}
    </div>
  );
}

function Tier2Row({ rule }: { rule: ActiveRule }) {
  const isLocal = rule.rule_tier === "local";
  return (
    <div className={`rule-card ${isLocal ? "border-conflict-200" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {formatCategory(rule.category)}
          </p>
          <p className="text-sm text-slate-700 mt-0.5">
            {rule.plain_language_text ?? rule.canonical_text}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isLocal && (
            <span className="text-xs bg-conflict-100 text-conflict-700 px-2 py-0.5 rounded-full">Local</span>
          )}
          {rule.safety_critical && (
            <span className="text-xs bg-safety-100 text-safety-700 px-2 py-0.5 rounded-full">Safety</span>
          )}
          <span className="text-xs text-slate-400">{rule.governing_body_source ?? "Standard"}</span>
        </div>
      </div>
    </div>
  );
}
