import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 border-2 border-black">
      <Button
        onClick={() => setLanguage("ja")}
        className={`font-black uppercase px-4 py-2 ${
          language === "ja" ? "bg-black text-white" : "bg-white text-black"
        }`}
        variant="ghost"
        size="sm"
      >
        日本語
      </Button>
      <div className="w-px h-6 bg-black" />
      <Button
        onClick={() => setLanguage("en")}
        className={`font-black uppercase px-4 py-2 ${
          language === "en" ? "bg-black text-white" : "bg-white text-black"
        }`}
        variant="ghost"
        size="sm"
      >
        EN
      </Button>
    </div>
  );
}
