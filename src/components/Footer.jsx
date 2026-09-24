import { useLanguage } from "../utils/i18n";

function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <span className="app-footer-brand">Attendify</span>
        <span className="app-footer-sep" aria-hidden="true">
          •
        </span>
        <span className="app-footer-uni">{t("footer.uni")}</span>
      </div>
      <div className="app-footer-copy">{t("footer.copy")}</div>
    </footer>
  );
}

export default Footer;
