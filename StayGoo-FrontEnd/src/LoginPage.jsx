import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Check } from "lucide-react";
import footerImage from "./assets/footer.jpg";
import { loginUser, getMyProfile } from "./api";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoginError("");
    setIsLoading(true);

    try {
      const payload = await loginUser(email, password);
      const sessionData = payload.data || {};

      const token = sessionData.session ? sessionData.session.access_token : null;
      if (token) localStorage.setItem("staygooToken", token);

      const userMetadata = sessionData.user ? sessionData.user.user_metadata : null;
      if (userMetadata) {
          if (userMetadata.full_name) localStorage.setItem("staygooUserName", userMetadata.full_name);
          if (userMetadata.phone) localStorage.setItem("staygooUserPhone", userMetadata.phone);
      } else {
          localStorage.setItem("staygooUserName", email.split('@')[0]);
      }
      
        if (sessionData.user && sessionData.user.email) {
          localStorage.setItem("staygooUserEmail", sessionData.user.email);
        }

      const userRoleId = sessionData.user?.user_metadata?.user_type;
      const detectedRole = (userRoleId === 2) ? "host" : "traveler";

      localStorage.setItem("staygooSession", "true");
      localStorage.setItem("staygooAccessRole", detectedRole);

      // Intentar obtener perfil completo y guardar avatar si existe
      try {
        const profile = await getMyProfile();
        if (profile?.avatar) {
          localStorage.setItem("staygooUserPhoto", profile.avatar);
        }
      } catch (e) {
        // Silenciar errores aquí; el flujo principal de login ya fue exitoso
      }

      const params = new URLSearchParams(location.search);
      const redirectTarget = params.get("redirect");
      if (redirectTarget && redirectTarget.startsWith("/")) {
        navigate(redirectTarget, { replace: true });
        return;
      }
      navigate(detectedRole === "host" ? "/host-dashboard" : "/member-dashboard");
    } catch (error) {
      setLoginError(error.message || "Error al iniciar sesión. Verifica tus datos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginBackground" aria-hidden="true">
        <img src={footerImage} alt="" className="loginBackgroundImage" />
      </div>

      <header className="loginTopBar">
        <Link to="/" className="loginBackLink">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Volver a StayGoo</span>
        </Link>
      </header>

      <main className="loginLayout">
        <section className="loginFormPanel">
          <p className="loginEyebrow">ACCESO EXCLUSIVO</p>
          <h1>Iniciar sesión</h1>

          <form className="loginForm" onSubmit={handleSubmit}>

            <label htmlFor="email">Correo electrónico</label>
            <div className="loginInputWrap">
              <Mail size={16} aria-hidden="true" />
              <input
                id="email"
                type="email"
                placeholder="tu-correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="loginPasswordRow">
              <label htmlFor="password">Contraseña</label>
              <button type="button">Olvidé mi contraseña</button>
            </div>
            <div className="loginInputWrap">
              <Lock size={16} aria-hidden="true" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {loginError && (
              <p style={{ color: "#ef4444", fontSize: "0.85rem", margin: "4px 0" }}>
                {loginError}
              </p>
            )}

            <label className="loginRememberRow">
              <span className="loginRememberBox">
                <Check size={13} aria-hidden="true" />
              </span>
              <span>Recuérdame durante 30 días</span>
            </label>

            <button className="loginPrimaryBtn" type="submit" disabled={isLoading}>
              {isLoading ? "Ingresando..." : "Entrar a StayGoo"}
            </button>
          </form>

          <p className="loginSignupText">
            ¿Eres nuevo en StayGoo? <Link to="/register">Crear cuenta</Link>
          </p>
        </section>
      </main>
    </div>
  );
}

export default LoginPage;
