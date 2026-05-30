import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CreditCard,
  Palette,
  ShieldCheck,
  UserCog,
  Camera,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuthUser } from "../useAuthUser";
import { updateMyProfile, uploadUserAvatar } from "../api";

const settingTabs = [
  { id: "account", icon: UserCog },
  { id: "privacy", icon: ShieldCheck },
  { id: "notifications", icon: Bell },
  { id: "appearance", icon: Palette },
  { id: "payments", icon: CreditCard },
];

const tabLabels = {
  account: "Mi cuenta",
  privacy: "Privacidad y seguridad",
  notifications: "Notificaciones",
  appearance: "Apariencia",
  payments: "Pagos"
};

const DEFAULT_PROFILE_PHOTO =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=240&q=80";

export function SettingsSection({ profilePhoto, onProfilePhotoChange, onDirtyChange }) {
  const navigate = useNavigate();
  const user = useAuthUser();
  const [activeTab, setActiveTab] = useState("account");
  const [isSaving, setIsSaving] = useState(false);
  const [toggles, setToggles] = useState({
    twoFactor: true,
    marketingEmails: false,
    pushNotifications: true,
    darkPreview: false,
    autoTranslate: (() => {
      try {
        const saved = window.localStorage.getItem("staygooAutoTranslate");
        return saved ? saved === "true" : true;
      } catch {
        return true;
      }
    })(),
  });
  const [localUserPhoto, setLocalUserPhoto] = useState(
    () => localStorage.getItem("staygooUserPhoto") || profilePhoto || DEFAULT_PROFILE_PHOTO
  );
  // Archivo File real seleccionado por el usuario (pendiente de subir)
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  // Ref a la URL temporal de preview (para poder revocarla despues)
  const previewUrlRef = useRef(null);
  const [currency, setCurrency] = useState(() => {
    try {
      return window.localStorage.getItem("staygooCurrency") || "cop";
    } catch {
      return "cop";
    }
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  // Estado para los campos editables
  const [formData, setFormData] = useState({
      fullName: "",
      email: "",
      phone: ""
  });

  // Cargar datos al montar el componente
  useEffect(() => {
      const savedName = localStorage.getItem("staygooUserName") || "";
      const savedEmail = localStorage.getItem("staygooUserEmail") || "";
      const savedPhone = localStorage.getItem("staygooUserPhone") || "";
      
      setFormData({
          fullName: savedName,
          email: savedEmail,
          phone: savedPhone
      });
  }, [user]);

  const userPhoto = localUserPhoto || profilePhoto || DEFAULT_PROFILE_PHOTO;

  // Sincronizar si el padre cambia la foto externamente
  useEffect(() => {
    if (profilePhoto && profilePhoto !== localUserPhoto && !pendingAvatarFile) {
      setLocalUserPhoto(profilePhoto);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilePhoto]);

  const currentTabLabel = useMemo(
    () => tabLabels[activeTab] ?? "Configuración",
    [activeTab]
  );

  const toggleSwitch = (key) => {
    setToggles((prev) => {
      const nextValue = !prev[key];
      setHasUnsavedChanges(true);
      return { ...prev, [key]: nextValue };
    });
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
        // 1. Si hay imagen pendiente, subirla primero al bucket 'avatars'
        let finalAvatarUrl = localUserPhoto;
        if (pendingAvatarFile) {
            const result = await uploadUserAvatar(pendingAvatarFile);
            finalAvatarUrl = result.avatar;
            setPendingAvatarFile(null);
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
                previewUrlRef.current = null;
            }
        }

        // 2. Guardar localmente
        localStorage.setItem("staygooUserName", formData.fullName);
        localStorage.setItem("staygooUserEmail", formData.email);
        localStorage.setItem("staygooUserPhone", formData.phone);
        localStorage.setItem("staygooUserPhoto", finalAvatarUrl);
        
        // 3. Guardar nombre/teléfono en backend (el avatar ya fue guardado por uploadUserAvatar)
        await updateMyProfile({ name: formData.fullName, phone: formData.phone });

        setLocalUserPhoto(finalAvatarUrl);
        onProfilePhotoChange?.(finalAvatarUrl);
        setHasUnsavedChanges(false);
        onDirtyChange?.(false);
        alert("Cambios guardados con éxito");
    } catch (error) {
        console.error(error);
        alert(error.message || "No se pudieron guardar los cambios.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.clear();
    navigate("/");
  };

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return (
          <div className="settingsContentGrid">
            <section className="settingsCard">
              <h3>Información de perfil</h3>
              <div className="settingsPhotoSection">
                <label className="settingsPhotoUpload">
                  <img src={userPhoto} alt="Profile" className="settingsProfilePhoto" />
                  <div className="settingsPhotoOverlay"><Camera size={24} /></div>
                  <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                          // Liberar URL de preview anterior
                          if (previewUrlRef.current) {
                              URL.revokeObjectURL(previewUrlRef.current);
                          }
                          const previewUrl = URL.createObjectURL(file);
                          previewUrlRef.current = previewUrl;
                          setLocalUserPhoto(previewUrl);
                          setPendingAvatarFile(file);
                          onProfilePhotoChange?.(previewUrl);
                          setHasUnsavedChanges(true);
                      }
                  }} style={{ display: "none" }} />
                </label>
                <div className="settingsPhotoInfo">
                  <h4>{formData.fullName || "Usuario"}</h4>
                  <p>{user.role === 'host' ? "Host verificado" : "Viajero"}</p>
                </div>
              </div>
              <div className="settingsFormGrid">
                <label>
                  Nombre completo
                  <input 
                    type="text" 
                    value={formData.fullName} 
                    onChange={(e) => {
                        setFormData({...formData, fullName: e.target.value});
                        setHasUnsavedChanges(true);
                    }} 
                  />
                </label>
                <label>
                  Email
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => {
                        setFormData({...formData, email: e.target.value});
                        setHasUnsavedChanges(true);
                    }} 
                  />
                </label>
                <label>
                  Teléfono
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={(e) => {
                        setFormData({...formData, phone: e.target.value});
                        setHasUnsavedChanges(true);
                    }} 
                  />
                </label>
                <label>
                  Contraseña
                  <input type="password" defaultValue="************" disabled />
                </label>
              </div>
            </section>
          </div>
        );
      default: return <p style={{padding: '20px'}}>Sección en desarrollo</p>;
    }
  };

  return (
    <section className="settingsPage">
      <aside className="settingsNavPanel">
        <div className="settingsSidebarTop">
          <div>
            <p className="settingsSidebarKicker">Centro de cuenta</p>
            <h2>Ajustes de usuario</h2>
          </div>
          <span className="settingsSidebarBadge"><Sparkles size={12} />En vivo</span>
        </div>

        <div className="settingsSidebarProfile">
          <img src={userPhoto} alt="Profile" />
          <div>
            <strong>{formData.fullName}</strong>
            <p>{formData.email}</p>
          </div>
        </div>

        <nav>
          {settingTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`settingsNavItem ${activeTab === tab.id ? "isActive" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} />
              {tabLabels[tab.id] ?? tab.id}
              <ChevronRight size={14} className="settingsNavChevron" />
            </button>
          ))}
        </nav>

        <button type="button" className="settingsLogoutBtn" onClick={handleLogout}>
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </aside>

      <div className="settingsPanel">
        <header className="settingsPanelHeader">
          <h1>{currentTabLabel}</h1>
          <button 
            type="button" 
            className="settingsPrimaryBtn" 
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges || isSaving}
          >
            {isSaving ? "..." : "Guardar cambios"}
          </button>
        </header>
        {renderTabContent()}
      </div>
    </section>
  );
}
