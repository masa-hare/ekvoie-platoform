import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-ultra-bold text-4xl">LOADING...</div>
      </div>
    );
  }

  // Admin check based on owner openId
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-[100dvh] bg-white relative">
      {/* Language switcher and admin access in top right corner */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex items-center gap-2 md:gap-4">
        <LanguageSwitcher />
        {isAdmin ? (
          <Button
            onClick={() => setLocation("/admin")}
            className="brutalist-border font-black uppercase"
            variant="outline"
            size="sm"
          >
            {t("nav.admin")}
          </Button>
        ) : (
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="brutalist-border font-black uppercase opacity-30 hover:opacity-100 transition-opacity"
            variant="outline"
            size="sm"
          >
            {t("nav.admin")}
          </Button>
        )}
      </div>

      {/* Geometric background elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-black" />
      <div className="absolute bottom-0 left-0 w-full h-2 bg-black" />
      <div className="absolute top-0 left-0 w-2 h-full bg-black" />
      <div className="absolute top-0 right-0 w-2 h-full bg-black" />

      {/* Main content */}
      <div className="container min-h-[100dvh] flex flex-col justify-center items-start py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl w-full relative"
        >
          <div className="py-8 md:py-12">
            {/* Main headline */}
            <h1 className="text-4xl sm:text-6xl md:text-ultra-bold mb-10 md:mb-12 leading-tight font-black">
              {t("home.title").split(" ").map((word, i) => (
                <span key={i}>
                  {word}
                  <br />
                </span>
              ))}
            </h1>

            {/* Underlined tagline */}
            <div className="brutalist-underline inline-block mb-12 md:mb-16">
              <p className="text-lg sm:text-2xl md:text-3xl font-bold uppercase tracking-tight leading-relaxed">
                {t("home.tagline")}
              </p>
            </div>

            {/* Description with geometric emphasis */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 mb-16 md:mb-20">
              <div className="md:col-span-1 flex items-start">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-black" />
              </div>
              <div className="md:col-span-11">
                <p className="text-base sm:text-lg md:text-xl font-semibold leading-relaxed max-w-prose space-y-4">
                  {t("home.description")}
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch md:items-start mb-10 md:mb-12 w-full md:w-auto">
              <Button
                onClick={() => setLocation("/opinions")}
                className="brutalist-border-thick px-8 py-6 sm:px-10 sm:py-7 text-base sm:text-xl font-black uppercase hover:bg-black hover:text-white transition-all duration-300 w-full md:w-auto"
                variant="outline"
              >
                {t("home.viewOpinions")}
              </Button>

              <Button
                onClick={() => setLocation("/submit")}
                className="brutalist-border-thick px-8 py-6 sm:px-10 sm:py-7 text-base sm:text-xl font-black uppercase bg-black text-white hover:bg-black/90 transition-all duration-300 w-full md:w-auto"
              >
                {t("home.submitOpinion")}
              </Button>

              <Button
                onClick={() => setLocation("/analytics")}
                className="brutalist-border-thick px-8 py-6 sm:px-10 sm:py-7 text-base sm:text-xl font-black uppercase hover:bg-black hover:text-white transition-all duration-300 w-full md:w-auto"
                variant="outline"
              >
                {t("home.analytics")}
              </Button>
            </div>

            {/* Secondary CTA */}
            <div className="mt-6 md:mt-8">
              <Button
                onClick={() => setLocation("/how-it-works")}
                className="border-2 border-black px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-bold uppercase hover:bg-black hover:text-white transition-all"
                variant="ghost"
              >
                {t("home.howItWorks")}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer geometric element */}
      <div className="absolute bottom-8 right-8">
        <div className="grid grid-cols-3 gap-2">
          <div className="w-8 h-8 bg-black" />
          <div className="w-8 h-8 bg-black" />
          <div className="w-8 h-8 bg-white border-4 border-black" />
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 left-4 text-sm text-gray-600">
        <Link href="/about" className="hover:text-gray-900 transition-colors">
          {language === "ja" ? "サイトについて" : "About"}
        </Link>
      </footer>
    </div>
  );
}
