import type { Locale } from "../i18n";
import * as ko from "./ko";
import * as ja from "./ja";

export type MockData = typeof ko;

export function getMockData(locale: Locale): MockData {
  return locale === "ja" ? ja : ko;
}

export type {
  Subject,
  Manager,
  ActivityLogEntry,
  SignalStatus,
  ManagerRole,
  ApprovalStatus,
  LogType,
} from "../types";
