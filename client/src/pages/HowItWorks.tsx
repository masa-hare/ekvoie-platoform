import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, MessageSquare, Lightbulb, Vote, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HowItWorks() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const steps = [
    {
      icon: MessageSquare,
      title: t("howItWorks.step1Title"),
      subtitle: t("howItWorks.step1Subtitle"),
      description: t("howItWorks.step1Desc"),
    },
    {
      icon: Lightbulb,
      title: t("howItWorks.step2Title"),
      subtitle: t("howItWorks.step2Subtitle"),
      description: t("howItWorks.step2Desc"),
    },
    {
      icon: Vote,
      title: t("howItWorks.step3Title"),
      subtitle: t("howItWorks.step3Subtitle"),
      description: t("howItWorks.step3Desc"),
    },
    {
      icon: Eye,
      title: t("howItWorks.step4Title"),
      subtitle: t("howItWorks.step4Subtitle"),
      description: t("howItWorks.step4Desc"),
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-white">
      {/* Header */}
      <header className="border-b-4 border-black">
        <div className="container py-4 md:py-6 px-4 flex items-center gap-2 md:gap-4">
          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            className="font-bold p-2"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
          <h2 className="text-2xl sm:text-4xl md:text-6xl font-black uppercase">{t("howItWorks.title")}</h2>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6 md:py-12 px-4">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mb-12 md:mb-20"
        >
          <div className="brutalist-bracket text-4xl sm:text-7xl font-black mb-4">[</div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase leading-tight mb-6 md:mb-8 whitespace-pre-line">
            {t("howItWorks.processTitle")}
          </h1>
          <div className="brutalist-underline inline-block mb-6 md:mb-8">
            <p className="text-lg sm:text-2xl font-bold">{t("howItWorks.processSubtitle")}</p>
          </div>
          <p className="text-base sm:text-xl font-semibold leading-relaxed max-w-3xl">
            {t("howItWorks.processDesc")}
          </p>
        </motion.div>

        {/* Process steps */}
        <div className="space-y-8 md:space-y-16 mb-12 md:mb-20">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`grid grid-cols-1 md:grid-cols-12 gap-8 ${
                index % 2 === 0 ? "" : "md:flex-row-reverse"
              }`}
            >
              {/* Icon section */}
              <div
                className={`md:col-span-3 flex items-start ${
                  index % 2 === 0 ? "" : "md:col-start-10"
                }`}
              >
                <div className="brutalist-border-thick p-4 sm:p-8 bg-black text-white">
                  <step.icon className="w-12 h-12 sm:w-16 sm:h-16" />
                </div>
              </div>

              {/* Content section */}
              <div
                className={`md:col-span-9 ${
                  index % 2 === 0 ? "md:col-start-4" : "md:col-start-1"
                }`}
              >
                <div className="brutalist-border-thick p-4 sm:p-8">
                  <div className="text-xs sm:text-sm font-black text-muted-foreground mb-2">
                    {step.title}
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black uppercase mb-4">
                    {step.subtitle}
                  </h3>
                  <p className="text-base sm:text-lg font-semibold leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-center py-8 md:py-12 border-t-4 border-black"
        >
          <div className="brutalist-underline inline-block mb-6 md:mb-8">
            <h2 className="text-3xl sm:text-5xl font-black uppercase">READY TO START?</h2>
          </div>
          <p className="text-base sm:text-xl font-semibold mb-6 md:mb-8 max-w-2xl mx-auto">
            あなたの声を構造化し、大学を変える力に変えましょう。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation("/submit")}
              className="brutalist-border-thick font-black uppercase px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg bg-black text-white hover:bg-black/90"
            >
              問題を投稿する
            </Button>
            <Button
              onClick={() => setLocation("/opinions")}
              variant="outline"
              className="brutalist-border-thick font-black uppercase px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg"
            >
              意見を見る
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
