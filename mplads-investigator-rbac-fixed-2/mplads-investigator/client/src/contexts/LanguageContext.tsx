import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "EN" | "HI" | "KN" | "TE" | "TA" | "MR" | "BN";

export const LANGUAGE_LABELS: Record<Language, string> = {
  EN: "English",
  HI: "हिंदी (Hindi)",
  KN: "ಕನ್ನಡ (Kannada)",
  TE: "తెలుగు (Telugu)",
  TA: "தமிழ் (Tamil)",
  MR: "मराठी (Marathi)",
  BN: "বাংলা (Bengali)",
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translateDynamicText: (text: string) => Promise<string>;
}

const translations: Record<string, Record<string, string>> = {
  EN: {
    dashboard: "Dashboard",
    projects: "Projects",
    newProposal: "New proposal",
    flags: "Flags",
    collusion: "Collusion Detection",
    reports: "Reports",
    users: "User Management",
    audit: "Audit Trail",
    compliance: "Compliance",
    accessibility: "Accessibility",
    languageToggle: "English / हिंदी",
    activeRole: "Active Role",
    portalSubtitle: "Oversight Portal",
    dataDisclaimer: "Public eSAKSHI Records · Operational Intelligence",
  },
  HI: {
    dashboard: "डैशबोर्ड",
    projects: "परियोजनाएं",
    newProposal: "नया प्रस्ताव",
    flags: "जोखिम संकेत (Flags)",
    collusion: "सांठगांठ जांच (Collusion)",
    reports: "रिपोर्ट्स",
    users: "उपयोगकर्ता प्रबंधन",
    audit: "ऑडिट ट्रेल",
    compliance: "अनुपालन (Compliance)",
    accessibility: "सुलभता (Accessibility)",
    languageToggle: "हिंदी / English",
    activeRole: "सक्रिय भूमिका",
    portalSubtitle: "निगरानी पोर्टल",
    dataDisclaimer: "सार्वजनिक ई-साक्षी रिकॉर्ड · परिचालन निगरानी",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: "EN",
  setLanguage: () => {},
  t: (key) => key,
  translateDynamicText: async (text) => text,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("mplads.lang") as Language) || "EN";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("mplads.lang", lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.EN[key] || key;
  };

  const translateDynamicText = async (text: string): Promise<string> => {
    if (language === "EN" || !text) return text;
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage: LANGUAGE_LABELS[language] }),
      });
      if (!res.ok) return text;
      const data = (await res.json()) as { translatedText?: string };
      return data.translatedText || text;
    } catch {
      return text;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateDynamicText }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
