import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import "../styles/language-toggle.css";

const STORAGE_KEY = "att-lang";

const STRINGS = {
  en: {
    "brand.tagline": "SMART ATTENDANCE",
    "brand.uni": "Badr University in Assiut",
    "footer.copy": "© Aboelyazed Hatem Aboelyazed",
    "footer.uni": "Badr University in Assiut",
    "nav.dashboard": "Dashboard",
    "nav.attendance": "Attendance",
    "nav.myAttendance": "My Attendance",
    "nav.scan": "Scan Attendance",
    "nav.scanShort": "Scan",
    "nav.corrections": "Correction Requests",
    "nav.requests": "Requests",
    "nav.profile": "Profile",
    "nav.sessions": "Attendance Sessions",
    "nav.mySections": "My Sections",
    "nav.reports": "Reports",
    "nav.users": "Users",
    "nav.courses": "Courses",
    "nav.sections": "Sections",
    "nav.rooms": "Rooms",
    "nav.timetable": "Timetable",
    "nav.settings": "Settings",
    "nav.enrollments": "Enrollments",
    "nav.home": "Home",
    "role.student": "Student",
    "role.lecturer": "Lecturer",
    "action.logout": "Logout",
    "action.refresh": "Refresh",
    "auth.welcome": "Welcome Back",
    "auth.subtitle": "Sign in to your account",
    "auth.identifier": "University Email or University ID",
    "auth.identifierPh": "Enter your university email or university ID",
    "auth.password": "Password",
    "auth.forgot": "Forgot password?",
    "auth.signIn": "Sign In",
    "auth.signingIn": "Signing In...",
    "auth.createAccount": "Create an Account",
    "auth.system": "Smart Attendance System",
    "auth.panelText":
      "Smart Attendance System for Badr University in Assiut. Sign in with your university email or university ID.",
    "auth.f1": "QR Code Attendance",
    "auth.f2": "Sections and Sessions",
    "auth.f3": "Attendance Reports",
    "logout.title": "Signed out successfully",
    "logout.text": "You have been safely signed out of your account.",
    "logout.signInAgain": "Sign In Again",
    "a11y.openNav": "Open navigation",
    "a11y.closeNav": "Close navigation",
    "a11y.logout": "Logout",
    "a11y.goDashboard": "Go to dashboard",
    "workspace.title": "Teaching workspace",
    "workspace.text":
      "View your assigned sections and manage attendance sessions.",
    "common.theme": "Theme",
    "lang.label": "Language",
  },
  ar: {
    "brand.tagline": "نظام الحضور الذكي",
    "brand.uni": "جامعة بدر بأسيوط",
    "footer.copy": "© Aboelyazed Hatem Aboelyazed",
    "footer.uni": "جامعة بدر بأسيوط",
    "nav.dashboard": "لوحة التحكم",
    "nav.attendance": "الحضور",
    "nav.myAttendance": "سجل الحضور",
    "nav.scan": "مسح الحضور",
    "nav.scanShort": "مسح",
    "nav.corrections": "طلبات التصحيح",
    "nav.requests": "الطلبات",
    "nav.profile": "الملف الشخصي",
    "nav.sessions": "جلسات الحضور",
    "nav.mySections": "شعبي الدراسية",
    "nav.reports": "التقارير",
    "nav.users": "المستخدمون",
    "nav.courses": "المقررات",
    "nav.sections": "الشعب",
    "nav.rooms": "القاعات",
    "nav.timetable": "الجدول الدراسي",
    "nav.settings": "الإعدادات",
    "nav.enrollments": "التسجيلات",
    "nav.home": "الرئيسية",
    "role.student": "طالب",
    "role.lecturer": "محاضر",
    "action.logout": "تسجيل الخروج",
    "action.refresh": "تحديث",
    "auth.welcome": "مرحبًا بعودتك",
    "auth.subtitle": "سجل الدخول إلى حسابك",
    "auth.identifier": "البريد الجامعي أو الرقم الجامعي",
    "auth.identifierPh": "أدخل بريدك الجامعي أو رقمك الجامعي",
    "auth.password": "كلمة المرور",
    "auth.forgot": "نسيت كلمة المرور؟",
    "auth.signIn": "تسجيل الدخول",
    "auth.signingIn": "جارٍ تسجيل الدخول...",
    "auth.createAccount": "إنشاء حساب",
    "auth.system": "نظام الحضور الذكي",
    "auth.panelText":
      "نظام الحضور الذكي لجامعة بدر بأسيوط. سجل الدخول ببريدك الجامعي أو رقمك الجامعي.",
    "auth.f1": "حضور برمز QR",
    "auth.f2": "الشعب والجلسات",
    "auth.f3": "تقارير الحضور",
    "logout.title": "تم تسجيل الخروج بنجاح",
    "logout.text": "تم تسجيل خروجك من حسابك بأمان.",
    "logout.signInAgain": "تسجيل الدخول مجددًا",
    "a11y.openNav": "فتح القائمة",
    "a11y.closeNav": "إغلاق القائمة",
    "a11y.logout": "تسجيل الخروج",
    "a11y.goDashboard": "الذهاب إلى لوحة التحكم",
    "workspace.title": "مساحة التدريس",
    "workspace.text": "اطّلع على شعبك الدراسية وأدر جلسات الحضور.",
    "common.theme": "السمة",
    "lang.label": "اللغة",
  },
};

function getInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") {
      return saved;
    }
  } catch {
    /* storage unavailable — fall back to English */
  }
  return "en";
}

function applyLang(lang) {
  try {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  } catch {
    /* non-DOM environment */
  }
}

const LanguageContext = createContext({
  lang: "en",
  dir: "ltr",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  useEffect(() => {
    applyLang(lang);
  }, [lang]);

  const setLang = useCallback((next) => {
    const value = next === "ar" ? "ar" : "en";
    setLangState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const t = useCallback(
    (key) => STRINGS[lang][key] ?? STRINGS.en[key] ?? key,
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      t,
    }),
    [lang, setLang, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageToggle({ className = "" }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      className={className ? `lang-toggle ${className}` : "lang-toggle"}
      role="group"
      aria-label={t("lang.label")}
    >
      <button
        type="button"
        className={lang === "en" ? "active" : ""}
        aria-pressed={lang === "en"}
        onClick={() => setLang("en")}
      >
        EN
      </button>

      <button
        type="button"
        className={lang === "ar" ? "active" : ""}
        aria-pressed={lang === "ar"}
        onClick={() => setLang("ar")}
      >
        عربي
      </button>
    </div>
  );
}
