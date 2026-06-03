import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Calendar, Check, User } from "lucide-react";
import { getMyProfile, getMyBookings } from "../api";
import { useAuthUser } from "../useAuthUser";

export function ProfileSection({ profilePhoto }) {
  const authUser = useAuthUser();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    joinDate: "",
    bio: "",
  });

  const [reservationHistory, setReservationHistory] = useState([]);
  const [editedData, setEditedData] = useState(userData);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Cargar perfil
        try {
          const profile = await getMyProfile();
          if (profile) {
              const formattedProfile = {
                name: profile.name || authUser.name || "Usuario",
                email: profile.email || authUser.email || "",
                phone: profile.phone || "",
                country: profile.country || "No especificado",
                joinDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString("es-ES", { month: "long", year: "numeric" }) : "Reciente",
                bio: profile.bio || "Sin biografía aún.",
              };
              setUserData(formattedProfile);
              setEditedData(formattedProfile);
          }
        } catch (err) {
            console.error("Error loading profile:", err);
            // Si falla el API, al menos usamos lo que hay en authUser
            const fallback = {
                name: authUser.name || "Usuario",
                email: authUser.email || "",
                phone: "",
                country: "Desconocido",
                joinDate: "Reciente",
                bio: "Ocurrió un error al cargar los datos.",
            };
            setUserData(fallback);
        }

        // Cargar reservas
        try {
          const bookings = await getMyBookings();
          if (bookings && Array.isArray(bookings)) {
            const mapped = bookings.map(b => {
              const housingInfo = b.housing || {};
              const nights = Math.ceil((new Date(b.end_date) - new Date(b.start_date)) / (1000 * 60 * 60 * 24)) || 1;
              const images = b.housing?.housing_images || [];
              const normalImg = images.find(img => !img.is_panorama);
              return {
                id: b.id_booking,
                title: housingInfo.name || "Alojamiento",
                location: housingInfo.municipality || housingInfo.address || "Ubicación",
                dates: `${new Date(b.start_date).toLocaleDateString()} - ${new Date(b.end_date).toLocaleDateString()}`,
                totalPrice: b.total_price ? `$${Number(b.total_price).toLocaleString()}` : "N/A",
                totalNights: nights,
                image: normalImg?.image_url || "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=400&q=80",
                status: new Date(b.start_date) > new Date() ? "upcoming" : "completed",
                rating: b.rating || null,
              };
            });
            setReservationHistory(mapped);
          }
        } catch (err) {
            console.error("Error loading bookings:", err);
        }

      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [authUser.name, authUser.email]);

  const handleSave = () => {
    setUserData(editedData);
    setIsEditing(false);
    // TODO: Add API call to update profile if needed
  };

  const handleCancel = () => {
    setEditedData(userData);
    setIsEditing(false);
  };

  const upcomingReservations = reservationHistory.filter(
    (r) => r.status === "upcoming"
  );
  const completedReservations = reservationHistory.filter(
    (r) => r.status === "completed"
  );

  if (loading) {
      return <div style={{ padding: "40px", textAlign: "center" }}>Cargando perfil...</div>;
  }

  return (
    <div className="profileSection">
      <header className="memberWelcome">
        <h1>
          My <span>Profile</span>
        </h1>
        <p>Manage your account and booking history</p>
      </header>

      <div className="profileContainer">
        <section className="profileInfoSection">
          <div className="profileHeader">
            <div className="profileHeaderAvatarWrap" style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", border: "3px solid var(--brand-blue)", flexShrink: 0 }}>
                {profilePhoto
                  ? <img src={profilePhoto} alt="Foto de perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "#eef2f8", display: "grid", placeItems: "center" }}><User size={40} color="#2f6fb2" /></div>
                }
            </div>
            <div className="profileHeaderInfo">
              <h2>{userData.name}</h2>
              <p className="profileMember">Member since {userData.joinDate}</p>
            </div>
          </div>

          {isEditing ? (
            <form className="profileForm">
              <div className="formGroup">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editedData.name}
                  onChange={(e) =>
                    setEditedData({ ...editedData, name: e.target.value })
                  }
                  placeholder="Your name"
                />
              </div>

              <div className="formGroup">
                <label>Email</label>
                <input
                  type="email"
                  value={editedData.email}
                  onChange={(e) =>
                    setEditedData({ ...editedData, email: e.target.value })
                  }
                  placeholder="your@email.com"
                />
              </div>

              <div className="formGroup">
                <label>Phone</label>
                <input
                  type="tel"
                  value={editedData.phone}
                  onChange={(e) =>
                    setEditedData({ ...editedData, phone: e.target.value })
                  }
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="formGroup">
                <label>Country</label>
                <input
                  type="text"
                  value={editedData.country}
                  onChange={(e) =>
                    setEditedData({ ...editedData, country: e.target.value })
                  }
                  placeholder="Your country"
                />
              </div>

              <div className="formGroup">
                <label>Bio</label>
                <textarea
                  value={editedData.bio}
                  onChange={(e) =>
                    setEditedData({ ...editedData, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself"
                  rows="3"
                />
              </div>

              <div className="formActions">
                <button
                  type="button"
                  className="saveBtnProfile"
                  onClick={handleSave}
                >
                  <Check size={16} />
                  Save Changes
                </button>
                <button
                  type="button"
                  className="cancelBtnProfile"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profileInfo">
              <div className="profileItem">
                <Mail size={16} />
                <div>
                  <p>Email</p>
                  <span>{userData.email}</span>
                </div>
              </div>

              <div className="profileItem">
                <Phone size={16} />
                <div>
                  <p>Phone</p>
                  <span>{userData.phone}</span>
                </div>
              </div>

              <div className="profileItem">
                <MapPin size={16} />
                <div>
                  <p>Country</p>
                  <span>{userData.country}</span>
                </div>
              </div>

              <div className="profileItem">
                <p>Bio</p>
                <p className="profileBio">{userData.bio}</p>
              </div>

            </div>
          )}
        </section>

        <section className="reservationHistorySection">
          <h3>Reservation History</h3>

          {upcomingReservations.length > 0 ? (
            <div className="reservationCategory">
              <h4 className="categoryTitle">Upcoming Stays</h4>
              <div className="reservationsList">
                {upcomingReservations.map((reservation) => (
                  <article
                    key={reservation.id}
                    className="reservationCard upcoming"
                  >
                    <img
                      src={reservation.image}
                      alt={reservation.title}
                      className="reservationImage"
                    />
                    <div className="reservationDetails">
                      <h4>{reservation.title}</h4>
                      <p className="reservationLocation">
                        <MapPin size={14} />
                        {reservation.location}
                      </p>
                      <p className="reservationDates">
                        <Calendar size={14} />
                        {reservation.dates}
                      </p>
                      <div className="reservationFooter">
                        <span className="reservationPrice">
                          {reservation.totalPrice}
                        </span>
                        <span className="reservationNights">
                          {reservation.totalNights} nights
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {completedReservations.length > 0 ? (
            <div className="reservationCategory">
              <h4 className="categoryTitle">Past Stays</h4>
              <div className="reservationsList">
                {completedReservations.map((reservation) => (
                  <article
                    key={reservation.id}
                    className="reservationCard completed"
                  >
                    <img
                      src={reservation.image}
                      alt={reservation.title}
                      className="reservationImage"
                    />
                    <div className="reservationDetails">
                      <h4>{reservation.title}</h4>
                      <p className="reservationLocation">
                        <MapPin size={14} />
                        {reservation.location}
                      </p>
                      <p className="reservationDates">
                        <Calendar size={14} />
                        {reservation.dates}
                      </p>
                      <div className="reservationFooter">
                        <span className="reservationPrice">
                          {reservation.totalPrice}
                        </span>
                        {reservation.rating && (
                          <span className="reservationRating">
                            ⭐ {reservation.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {reservationHistory.length === 0 && (
              <p style={{ color: "#6e7f99", marginTop: "20px" }}>No tienes historial de reservas aún.</p>
          )}
        </section>
      </div>
    </div>
  );
}
