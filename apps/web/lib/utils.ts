import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Sport, ConflictType, DiffEntry } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SPORT_LABELS: Record<Sport, string> = {
  soccer: "Soccer",
  baseball: "Baseball",
  basketball: "Basketball",
  football: "Football",
};

export const SPORT_EMOJI: Record<Sport, string> = {
  soccer: "⚽",
  baseball: "⚾",
  basketball: "🏀",
  football: "🏈",
};

export const SPORT_COLORS: Record<Sport, string> = {
  soccer: "bg-green-100 text-green-800 border-green-200",
  baseball: "bg-red-100 text-red-800 border-red-200",
  basketball: "bg-orange-100 text-orange-800 border-orange-200",
  football: "bg-blue-100 text-blue-800 border-blue-200",
};

export const AGE_BRACKETS = [
  "U6", "U8", "U10", "U11", "U12", "U14", "U16", "U18", "high_school",
];

export const DIVISION_TYPES = [
  { value: "recreational", label: "Recreational" },
  { value: "competitive", label: "Competitive" },
  { value: "travel", label: "Travel" },
  { value: "AAU", label: "AAU" },
  { value: "t_ball", label: "T-Ball" },
  { value: "coach_pitch", label: "Coach Pitch" },
  { value: "kid_pitch", label: "Kid Pitch" },
  { value: "flag", label: "Flag Football" },
  { value: "tackle", label: "Tackle Football" },
];

export const CONFLICT_TYPE_LABELS: Record<ConflictType, string> = {
  OVERRIDE: "Full Override",
  RESTRICT: "More Restrictive",
  EXPAND: "More Permissive",
  SUPPLEMENT: "Addendum",
  CONFLICT: "Direct Conflict",
};

export const CONFLICT_TYPE_COLORS: Record<ConflictType, string> = {
  OVERRIDE: "bg-purple-100 text-purple-800",
  RESTRICT: "bg-blue-100 text-blue-800",
  EXPAND: "bg-yellow-100 text-yellow-800",
  SUPPLEMENT: "bg-green-100 text-green-800",
  CONFLICT: "bg-red-100 text-red-800",
};

export const DIFF_TYPE_COLORS: Record<DiffEntry["diff_type"], string> = {
  MORE_RESTRICTIVE: "border-l-blue-500 bg-blue-50",
  MORE_PERMISSIVE: "border-l-yellow-500 bg-yellow-50",
  FUNDAMENTALLY_DIFFERENT: "border-l-red-500 bg-red-50",
  MISSING_IN_AWAY: "border-l-gray-400 bg-gray-50",
  MISSING_IN_HOME: "border-l-gray-400 bg-gray-50",
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCategory(cat: string): string {
  return cat.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
