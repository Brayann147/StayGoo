import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Mail, Lock, User } from "lucide-react";
import footerImage from "./assets/footer.jpg";
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
    email: "",
    password: "",
    confirmPassword: "",
    tipoUsuario: "viajero",
    aceptaTerminos: false,
    aceptaPoliticas: false,
    aceptaMarketing: false
  });

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
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
        telefono: formData.telefono,
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

  return (
    <div className="registerPage">
      <header className="registerTopBar">
        <Link to="/" className="registerBackLink">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>{t.auth.backToStaygoo}</span>
        </Link>
      </header>

      <main className="registerLayout">
        <section className="registerVisualPanel" aria-hidden="true">
          <img src={footerImage} alt="" className="registerVisualImage" />
          <div className="registerVisualCard">
            <h2>{t.auth.registerWelcomeTitle}</h2>
            <p>
              {t.auth.registerWelcomeText}
            </p>
          </div>
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
                <div className="registerInputWrap">
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    placeholder="+57 300 000 0000"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    required
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
                  <div className="registerInputWrap registerPasswordInput">
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
                </div>

                <div>
                  <label htmlFor="confirmPassword">{t.auth.confirmPassword}</label>
                  <div className="registerInputWrap registerPasswordInput">
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

              <button className="registerPrimaryBtn" type="submit" disabled={isLoading}>
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
