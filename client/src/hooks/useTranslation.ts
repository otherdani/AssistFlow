// This is a legacy hook - use useLanguage from LanguageContext instead
import { useLanguage } from "@/contexts/LanguageContext";

export function useTranslation() {
  return useLanguage();
}