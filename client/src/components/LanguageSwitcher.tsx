import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, changeLanguage, t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <div className="flex rounded-md border">
        <Button
          variant={language === "en" ? "default" : "ghost"}
          size="sm"
          onClick={() => changeLanguage("en")}
          className="rounded-r-none border-r"
          data-testid="button-lang-en"
        >
          EN
        </Button>
        <Button
          variant={language === "hu" ? "default" : "ghost"}
          size="sm"
          onClick={() => changeLanguage("hu")}
          className="rounded-l-none"
          data-testid="button-lang-hu"
        >
          HU
        </Button>
      </div>
    </div>
  );
}