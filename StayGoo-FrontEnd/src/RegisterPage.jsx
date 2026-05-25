import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Mail, Lock, User, Check } from "lucide-react";
import footerImage from "./assets/footer.jpg";
import phoneCodes from "./phoneCodes";
import { registerUser } from "./api";
import "./RegisterPage.css";

const t = {
  auth: {
    errorPasswordMismatch: "Las contraseñas no coinciden",
    errorAdultOnly: "Debes ser mayor de edad para registrarte",
    errorTermsRequired: "Debes aceptar los términos y políticas",
    backToStaygoo: "Volver a StayGoo",
    registerWelcomeTitle: "Bienvenido a StayGoo",
    registerWelcomeText: "Regístrate para encontrar los mejores lugares o para convertirte en anfitrión.",
    registerTitle: "Crear cuenta",
    registerSubtitle: "Rellena los datos a continuación para registrarte.",
    personalInfo: "Información Personal",
    firstName: "Nombre",
    lastName: "Apellido",
    birthDate: "Fecha de nacimiento",
    countryRegion: "País/Región",
    phone: "Teléfono",
    accountData: "Datos de la cuenta",
    emailAddress: "Correo electrónico",
    password: "Contraseña",
    minCharsPlaceholder: "Mínimo 8 caracteres",
    passwordRequirementsTitle: "Tu contraseña debe incluir:",
    passwordRequirements: "La contraseña no cumple los requisitos de seguridad.",
    passwordRequirementsList: [
      "Al menos 8 caracteres",
      "Una letra mayúscula",
      "Una letra minúscula",
      "Un número",
      "Un símbolo"
    ],
    showPasswordAria: "Mostrar contraseña",
    confirmPassword: "Confirmar contraseña",
    repeatPasswordPlaceholder: "Repite tu contraseña",
    userType: "Tipo de usuario",
    traveler: "Viajero",
    host: "Anfitrión",
    acceptTerms: "Acepto los Términos y Condiciones",
    acceptPrivacy: "Acepto las Políticas de Privacidad",
    acceptMarketing: "Acepto recibir correos de marketing",
    registerSubmit: "Registrarse",
    alreadyHaveAccount: "¿Ya tienes cuenta?",
    loginLink: "Inicia sesión"
  }
};

function getDefaultPhoneLabel() {
  const match = Array.isArray(phoneCodes)
    ? phoneCodes.find((c) => c.code === "+57")
    : null;
  return match?.label || "Colombia (+57)";
}

function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    fechaNacimiento: "",
    pais: "",
    telefono: "",
    phoneCode: "+57",
    phoneCodeLabel: getDefaultPhoneLabel(),
    customPhoneCode: "",
    email: "",
    password: "",
    confirmPassword: "",
    tipoUsuario: "viajero",
    aceptaTerminos: false,
    aceptaPoliticas: false,
    aceptaMarketing: false
  });

  useEffect(() => {
    // Try to infer country from browser locale first
    const tryLocale = () => {
      try {
        const lang = (navigator.languages && navigator.languages[0]) || navigator.language;
        if (!lang) return false;
        const parts = lang.split(/[-_]/);
        const region = parts.length > 1 ? parts[1] : null;
        if (!region) return false;
        const iso = region.toUpperCase();
        const match = phoneCodes.find((c) => c.iso === iso);
        if (match) {
          setFormData((prev) => ({ ...prev, phoneCode: match.code, phoneCodeLabel: match.label }));
          return true;
        }
      } catch (e) {
        /* ignore */
      }
      return false;
    };

    if (tryLocale()) return;

    // Fallback: try geolocation -> reverse geocode via Nominatim
    if (navigator.geolocation) {
      const success = async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3&addressdetails=1`;
          const res = await fetch(url);
          if (!res.ok) return;
          const data = await res.json();
          const cc = data?.address?.country_code?.toUpperCase();
          if (!cc) return;
          const match = phoneCodes.find((c) => c.iso === cc);
          if (match) {
            setFormData((prev) => ({ ...prev, phoneCode: match.code, phoneCodeLabel: match.label }));
          }
        } catch (e) {
          // ignore
        }
      };

      const error = () => {};
      navigator.geolocation.getCurrentPosition(success, error, { timeout: 5000 });
    }
  }, []);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (name === "phoneCodeLabel") {
      // If user types/selects a country label, try to find matching code
      const match = phoneCodes.find((c) => c.label === value);
      if (match) {
        setFormData((prev) => ({ ...prev, phoneCodeLabel: value, phoneCode: match.code }));
        return;
      }
      // If user types a code directly like +34, use it as phoneCode
      if (/^\+\d+/.test(value)) {
        setFormData((prev) => ({ ...prev, phoneCodeLabel: value, phoneCode: value }));
        return;
      }
      // Otherwise just update the label field
      setFormData((prev) => ({ ...prev, phoneCodeLabel: value }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const isStrongPassword = (password) => {
    return (
      typeof password === "string"
      && password.length >= 8
      && /[a-z]/.test(password)
      && /[A-Z]/.test(password)
      && /\d/.test(password)
      && /[^A-Za-z0-9]/.test(password)
    );
  };

  const getAge = (birthDate) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return age;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setFormError(t.auth.errorPasswordMismatch);
      return;
    }

    if (!isStrongPassword(formData.password)) {
      setFormError(t.auth.passwordRequirements);
      return;
    }

    if (!formData.fechaNacimiento || getAge(new Date(formData.fechaNacimiento)) < 18) {
      setFormError(t.auth.errorAdultOnly);
      return;
    }

    if (!formData.aceptaTerminos || !formData.aceptaPoliticas) {
      setFormError(t.auth.errorTermsRequired);
      return;
    }

    setFormError("");
    setIsLoading(true);

    try {
      await registerUser({
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        password: formData.password,
        telefono:
          (formData.phoneCode === "other" ? formData.customPhoneCode : formData.phoneCode) + formData.telefono,
        fechaNacimiento: formData.fechaNacimiento,
        pais: formData.pais,
        tipoUsuario: formData.tipoUsuario,
      });
      // Registro exitoso: redirigir al login
      navigate("/login");
    } catch (error) {
      setFormError(error.message || "Error al registrarse. Intente de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordStrong = isStrongPassword(formData.password);
  const requiredFields = [
    "nombre",
    "apellido",
    "fechaNacimiento",
    "pais",
    "telefono",
    "email",
    "password",
    "confirmPassword"
  ];

  const requiredFieldsFilled = requiredFields.every((key) => {
    const v = formData[key];
    if (typeof v === "string") return v.trim().length > 0;
    return Boolean(v);
  });

  const canSubmit =
    !isLoading &&
    requiredFieldsFilled &&
    isPasswordStrong &&
    formData.password === formData.confirmPassword &&
    formData.aceptaTerminos &&
    formData.aceptaPoliticas;

  const passwordsMatch =
    formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  const passwordWrapClass = (base = "registerInputWrap registerPasswordInput") => {
    if (!formData.password && !formData.confirmPassword) return base;
    return `${base} ${passwordsMatch ? "pw-match" : "pw-mismatch"}`;
  };

  return (
    <div className="registerPage">
      <div className="registerBackground" aria-hidden="true">
        <img src={footerImage} alt="" className="registerBackgroundImage" />
      </div>

      <header className="registerTopBar">
        <Link to="/" className="registerBackLink">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>{t.auth.backToStaygoo}</span>
        </Link>
      </header>

      <main className="registerLayout">
        <section className="registerWelcomePanel" aria-labelledby="register-welcome-title">
          <p className="registerWelcomeEyebrow">UNETE A LA COMUNIDAD</p>
          <h2 id="register-welcome-title">{t.auth.registerWelcomeTitle}</h2>
          <p className="registerWelcomeText">{t.auth.registerWelcomeText}</p>
        </section>

        <section className="registerFormPanel">
          <h1>{t.auth.registerTitle}</h1>
          <p className="registerSubtitle">{t.auth.registerSubtitle}</p>

          <div className="registerFormScroller">
            <form className="registerForm" onSubmit={handleSubmit}>
              <h2 className="registerSectionTitle">{t.auth.personalInfo}</h2>

              <div className="registerFormGrid">
                <div>
                  <label htmlFor="nombre">{t.auth.firstName}</label>
                  <div className="registerInputWrap">
                    <User size={16} aria-hidden="true" />
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      placeholder="Juan"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="apellido">{t.auth.lastName}</label>
                  <div className="registerInputWrap">
                    <User size={16} aria-hidden="true" />
                    <input
                      id="apellido"
                      name="apellido"
                      type="text"
                      placeholder="Perez"
                      value={formData.apellido}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="registerFormGrid">
                <div>
                  <label htmlFor="fechaNacimiento">{t.auth.birthDate}</label>
                  <div className="registerInputWrap">
                    <input
                      id="fechaNacimiento"
                      name="fechaNacimiento"
                      type="date"
                      value={formData.fechaNacimiento}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="pais">{t.auth.countryRegion}</label>
                  <div className="registerInputWrap">
                    <input
                      id="pais"
                      name="pais"
                      type="text"
                      placeholder="Colombia"
                      value={formData.pais}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="telefono">{t.auth.phone}</label>
                <div className="registerInputWrap phoneInputWrap">
                  <input
                    list="phoneCodesList"
                    name="phoneCodeLabel"
                    value={formData.phoneCodeLabel}
                    onChange={handleInputChange}
                    aria-label="Buscar país o código"
                    className="phoneCodeField"
                    placeholder="Escribe país (ej. Colombia) o código"
                  />
                  <datalist id="phoneCodesList">
                    {phoneCodes.map((c) => (
                      <option key={c.code + c.label} value={c.label} />
                    ))}
                  </datalist>

                  {formData.phoneCode === "other" || formData.phoneCodeLabel === "Otro / Otro código" ? (
                    <input
                      name="customPhoneCode"
                      value={formData.customPhoneCode}
                      onChange={handleInputChange}
                      placeholder="+XX"
                      className="phoneCodeCustom"
                    />
                  ) : null}

                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    placeholder="300 000 0000"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    required
                    className="phoneNumberInput"
                  />
                </div>
              </div>

              <span className="registerSpacer" aria-hidden="true" />

              <h2 className="registerSectionTitle">{t.auth.accountData}</h2>

              <div>
                <label htmlFor="email">{t.auth.emailAddress}</label>
                <div className="registerInputWrap">
                  <Mail size={16} aria-hidden="true" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="registerFormGrid">
                <div>
                  <label htmlFor="password">{t.auth.password}</label>
                  <div className={passwordWrapClass()}>
                    <Lock size={16} aria-hidden="true" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t.auth.minCharsPlaceholder}
                      value={formData.password}
                      onChange={handleInputChange}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="registerEyeBtn"
                      aria-label={t.auth.showPasswordAria}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      <Eye size={16} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="registerPasswordHint">
                    <p>{t.auth.passwordRequirementsTitle}</p>
                    <ul>
                      {(() => {
                        const pwd = formData.password || "";
                        const checks = [
                          pwd.length >= 8,
                          /[A-Z]/.test(pwd),
                          /[a-z]/.test(pwd),
                          /\d/.test(pwd),
                          /[^A-Za-z0-9]/.test(pwd)
                        ];
                        return t.auth.passwordRequirementsList.map((item, idx) => {
                          const ok = checks[idx];
                          return (
                            <li key={item} className={ok ? "req-ok" : "req-no"}>
                              <Check size={14} className={ok ? "reqIcon ok" : "reqIcon no"} />
                              <span>{item}</span>
                            </li>
                          );
                        });
                      })()}
                    </ul>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword">{t.auth.confirmPassword}</label>
                  <div className={passwordWrapClass()}>
                    <Lock size={16} aria-hidden="true" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t.auth.repeatPasswordPlaceholder}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="registerEyeBtn"
                      aria-label={t.auth.showPasswordAria}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      <Eye size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="tipoUsuario">{t.auth.userType}</label>
                <div className="registerInputWrap">
                  <select
                    id="tipoUsuario"
                    name="tipoUsuario"
                    value={formData.tipoUsuario}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="viajero">{t.auth.traveler}</option>
                    <option value="host">{t.auth.host}</option>
                  </select>
                </div>
              </div>

              <span className="registerSpacer" aria-hidden="true" />

              <div className="registerChecks">
                <label className="registerCheckLabel">
                  <input
                    type="checkbox"
                    name="aceptaTerminos"
                    checked={formData.aceptaTerminos}
                    onChange={handleInputChange}
                  />
                  <span>{t.auth.acceptTerms}</span>
                </label>

                <label className="registerCheckLabel">
                  <input
                    type="checkbox"
                    name="aceptaPoliticas"
                    checked={formData.aceptaPoliticas}
                    onChange={handleInputChange}
                  />
                  <span>{t.auth.acceptPrivacy}</span>
                </label>

                <label className="registerCheckLabel">
                  <input
                    type="checkbox"
                    name="aceptaMarketing"
                    checked={formData.aceptaMarketing}
                    onChange={handleInputChange}
                  />
                  <span>{t.auth.acceptMarketing}</span>
                </label>
              </div>

              {formError ? <p className="registerError">{formError}</p> : null}

              <button
                className="registerPrimaryBtn"
                type="submit"
                disabled={!canSubmit}
                title={
                  !requiredFieldsFilled
                    ? "Rellena los campos obligatorios"
                    : formData.password !== formData.confirmPassword
                    ? "Las contraseñas no coinciden"
                    : !isPasswordStrong
                    ? "La contraseña no cumple los requisitos"
                    : !formData.aceptaTerminos || !formData.aceptaPoliticas
                    ? "Debes aceptar términos y políticas"
                    : undefined
                }
              >
                {isLoading ? "Registrando..." : t.auth.registerSubmit}
              </button>
            </form>

            <p className="registerLoginText">
              {t.auth.alreadyHaveAccount} <Link to="/login">{t.auth.loginLink}</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default RegisterPage;
