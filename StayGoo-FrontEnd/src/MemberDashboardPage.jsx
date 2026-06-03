import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Heart,
  Mail,
  User,
  Settings,
  MapPin,
} from "lucide-react";
import { TripsSection } from "./components/TripsSection";
import { FavoritesSection } from "./components/FavoritesSection";
import { MessagesSection } from "./components/MessagesSection";
import { ProfileSection } from "./components/ProfileSection";
import { SettingsSection } from "./components/SettingsSection";
import { getMyProfile } from "./api";
import "./MemberDashboardPage.css";

const DEFAULT_PROFILE_PHOTO = null;

function MemberDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const sections = [
    { id: "trips", label: "Mis viajes", icon: MapPin },
    { id: "favorites", label: "Favoritos", icon: Heart },
    { id: "messages", label: "Mensajes", icon: Mail },
    { id: "profile", label: "Perfil", icon: User },
    { id: "settings", label: "Configuración", icon: Settings },
  ];
  const [activeSection, setActiveSection] = useState(location.state?.initialSection ?? "trips");
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(() => {
    try {
      // Check both keys for compatibility
      return window.localStorage.getItem("staygooUserPhoto")
          || window.localStorage.getItem("staygooProfilePhoto")
          || null;
    } catch {
      return null;
    }
  });

  // Load avatar from API on mount
  useEffect(() => {
    getMyProfile()
      .then(profile => {
        if (profile?.avatar) {
          window.localStorage.setItem("staygooUserPhoto", profile.avatar);
          setProfilePhoto(profile.avatar);
        }
      })
      .catch(() => {});
  }, []);

  const goBackHome = () => {
    if (activeSection === "settings" && settingsDirty) {
      setPendingLeaveAction({ type: "home" });
      return;
    }

    navigate("/");
  };

  const handleSectionChange = (sectionId) => {
    if (activeSection === "settings" && sectionId !== "settings" && settingsDirty) {
      setPendingLeaveAction({ type: "section", sectionId });
      return;
    }

    setActiveSection(sectionId);
  };

  const continuePendingLeave = () => {
    if (pendingLeaveAction?.type === "home") {
      navigate("/");
    }

    if (pendingLeaveAction?.type === "section") {
      setActiveSection(pendingLeaveAction.sectionId);
    }

    setSettingsDirty(false);
    setPendingLeaveAction(null);
  };

  const handleSaveAndLeave = () => {
    continuePendingLeave();
  };

  const renderSection = () => {
    switch (activeSection) {
      case "trips":
        return <TripsSection />;
      case "favorites":
        return <FavoritesSection />;
      case "messages":
        return <MessagesSection />;
      case "profile":
        return <ProfileSection profilePhoto={profilePhoto} />;
      case "settings":
        return (
          <SettingsSection
            profilePhoto={profilePhoto}
            onProfilePhotoChange={setProfilePhoto}
            onDirtyChange={setSettingsDirty}
          />
        );
      default:
        return <TripsSection />;
    }
  };

  return (
    <div className="memberDashboardPage">
      <aside className="memberSidebar">
        <div className="memberProfileWrap">
          {profilePhoto
            ? <img className="memberProfileAvatar" src={profilePhoto} alt="Foto de perfil" />
            : <div className="memberProfileAvatar" style={{ display: 'grid', placeItems: 'center', background: '#eef2f8', border: '3px solid #d7e4f5' }}><User size={32} color="#2f6fb2" /></div>
          }
        </div>

        <nav className="memberNav">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`memberNavItem ${
                activeSection === section.id ? "memberNavItemActive" : ""
              }`}
              type="button"
              onClick={() => handleSectionChange(section.id)}
            >
              <section.icon size={16} /> {section.label}
            </button>
          ))}
        </nav>

        <button className="bookTripBtn" type="button" onClick={goBackHome}>
          Volver a inicio
        </button>
      </aside>

      <main
        className={`memberMainContent ${
          activeSection === "messages" || activeSection === "settings"
            ? "memberMainContentFill"
            : ""
        }`}
      >
        {renderSection()}
      </main>

      {pendingLeaveAction ? (
        <div className="settingsConfirmOverlay" role="presentation">
          <div className="settingsConfirmModal" role="dialog" aria-modal="true">
            <h3>Cambios sin guardar</h3>
            <p>
              Tienes cambios sin guardar en Ajustes.
            </p>
            <div className="settingsConfirmActions">
              <button
                type="button"
                className="settingsGhostBtn"
                onClick={continuePendingLeave}
              >
                Salir sin guardar cambios
              </button>
              <button
                type="button"
                className="settingsPrimaryBtn"
                onClick={handleSaveAndLeave}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MemberDashboardPage;
