import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import "./StayDetailPage.css";
import PanoramaViewer from "./PanoramaViewer";
import { getHousingById } from "./api";
import {
  isFavorite as isListingFavorite,
  toggleFavoriteId,
  FAVORITES_CHANGED_EVENT,
} from "./utils/favoritesStorage";

registerLocale("es", es);

const defaultGallery = [
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80"
];

const defaultReviews = [
  {
    name: "Mariana Torres",
    date: "Octubre 2023",
    text: "Increible estancia. Las fotos no alcanzan a mostrar lo bien que se disfruta la vista desde la terraza.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80"
  },
  {
    name: "Sofia Ramirez",
    date: "Septiembre 2023",
    text: "De las mejores estadias que he tenido. Todo se siente premium pero al mismo tiempo muy acogedor.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
  }
];

const clean = (value, fallback) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return value;
};

const formatPrice = (rawPrice) => {
  if (typeof rawPrice !== "string") {
    return "$280/noche";
  }
  if (rawPrice.includes("/night")) {
    return rawPrice.replace("/night", "/noche");
  }
  return rawPrice.includes("/noche") ? rawPrice : `${rawPrice}/noche`;
};

const getGallery = (stay) => {
  const source = [];
  if (Array.isArray(stay.housing_images)) {
    const normal = stay.housing_images.filter(img => !img.is_panorama).map(img => img.image_url);
    source.push(...normal);
  }
  if (Array.isArray(stay.gallery)) {
    source.push(...stay.gallery);
  }
  if (stay.image) {
    source.push(stay.image);
  }
  if (stay.coverImage) {
    source.push(stay.coverImage);
  }

  const unique = Array.from(new Set(source.filter(Boolean)));
  return [...unique, ...defaultGallery].slice(0, 5);
};

const getPanoramaSrc = (stay, defaultSrc) => {
  if (Array.isArray(stay.housing_images)) {
    const found = stay.housing_images.find(img => img.is_panorama);
    if (found) return found.image_url;
  }
  return defaultSrc;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const toIsoDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().split("T")[0];
};

const calculateNights = (checkIn, checkOut) => {
  if (!(checkIn instanceof Date) || !(checkOut instanceof Date)) {
    return 1;
  }
  const diffTime = checkOut.getTime() - checkIn.getTime();
  if (diffTime <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

function StayDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const stayData = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("data");
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return null;
    }
  }, [location.search]);

  const [stay, setStay] = useState(stayData ?? {});

  useEffect(() => {
    if (stayData) {
      setStay(stayData);
    }
  }, [stayData]);

  useEffect(() => {
    const fetchLatestDetails = async () => {
      const id = stayData?.realId || stayData?.id;
      if (id) {
        try {
          const latest = await getHousingById(id);
          if (latest) {
            const images = latest.housing_images || [];
            const normalImages = images.filter(img => !img.is_panorama);
            const firstImage = normalImages.length > 0 ? normalImages[0].image_url : "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80";

            setStay(prev => ({
              ...prev,
              ...latest,
              title: latest.name || prev.title,
              location: latest.address ? `${latest.address}, ${latest.city}` : latest.city || prev.location,
              maxGuests: latest.capacity || prev.maxGuests,
              price: `$${latest.price_per_night || 0}/noche`,
              image: firstImage,
              housing_images: images
            }));
          }
        } catch (err) {
          console.error("Error fetching latest stay details:", err);
        }
      }
    };
    fetchLatestDetails();
  }, [stayData]);

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const listingId = (stay.realId || stay.id)?.toString();
    if (!listingId) return;

    const syncFavorite = () => setIsFavorite(isListingFavorite(listingId));
    syncFavorite();
    window.addEventListener(FAVORITES_CHANGED_EVENT, syncFavorite);
    window.addEventListener("storage", syncFavorite);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, syncFavorite);
      window.removeEventListener("storage", syncFavorite);
    };
  }, [stay]);

  const handleToggleFavorite = () => {
    const listingId = (stay.realId || stay.id)?.toString();
    if (!listingId) return;

    try {
      toggleFavoriteId(listingId);
      setIsFavorite(isListingFavorite(listingId));
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const title = clean(stay.title, "Villa Horizonte");
  const locationName = clean(stay.location, clean(stay.cityRegion, "Santorini, Grecia"));
  const rating = clean(stay.rating, "4.9");
  const maxGuests = clean(stay.maxGuests, "2");
  const maxGuestsNumber = Math.max(Number(maxGuests) || 2, 1);
  const price = formatPrice(clean(stay.price, "$280/noche"));
  const description = clean(
    stay.description,
    "Experiencia premium con interiorismo editorial, privacidad y vistas abiertas en una ubicacion privilegiada."
  );
  const amenities = Array.isArray(stay.amenities) && stay.amenities.length > 0
    ? stay.amenities
    : ["Piscina infinita privada", "WiFi de alta velocidad", "Climatizacion central", "Vista panoramica al mar", "Chef privado disponible", "Estacionamiento valet gratuito", "Cocina gourmet", "Servicio completo de lavanderia"];
  const gallery = getGallery(stay);
  const panoramaSrc = getPanoramaSrc(stay, gallery[0]);
  const summaryPrice = Number(String(price).replace(/[^0-9.]/g, "")) || 280;
  const hostName = clean(stay.hostName, "Anfitrión");
  const isSuperHost = stay.isSuperHost ?? true;

  const defaultCheckIn = useMemo(() => new Date(), []);
  const defaultCheckOut = useMemo(() => addDays(defaultCheckIn, 5), [defaultCheckIn]);
  const [guestCount, setGuestCount] = useState(Math.min(maxGuestsNumber, 2));
  const [checkInDate, setCheckInDate] = useState(defaultCheckIn);
  const [checkOutDate, setCheckOutDate] = useState(defaultCheckOut);
  const [panoramaOpen, setPanoramaOpen] = useState(false);

  useEffect(() => {
    if (checkOutDate <= checkInDate) {
      setCheckOutDate(addDays(checkInDate, 1));
    }
  }, [checkInDate, checkOutDate]);

  const nights = useMemo(() => calculateNights(checkInDate, checkOutDate), [checkInDate, checkOutDate]);
  const total = summaryPrice * nights;

  const handleReserve = () => {
    const accessRole = window.localStorage.getItem("staygooAccessRole");
    const hasValidRole = accessRole === "host" || accessRole === "traveler";
    const isSessionActive = window.localStorage.getItem("staygooSession") === "true" && hasValidRole;
    if (!isSessionActive) {
      window.localStorage.removeItem("staygooSession");
      window.localStorage.removeItem("staygooAccessRole");
      const redirectTo = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
      navigate(`/login?redirect=${redirectTo}`);
      return;
    }

    const paymentPayload = encodeURIComponent(JSON.stringify({
      title,
      location: locationName,
      rating,
      price: `$${summaryPrice.toLocaleString()}/noche`,
      guests: guestCount,
      nights,
      total,
      image: gallery[0],
      data: stay,
      checkIn: toIsoDate(checkInDate),
      checkOut: toIsoDate(checkOutDate)
    }));

    navigate(`/payment?data=${paymentPayload}`);
  };

  const setShareStatus = (label) => {
    const shareLabel = document.getElementById("detailShareLabel");
    if (!shareLabel) {
      return;
    }

    shareLabel.textContent = label;
    window.setTimeout(() => {
      shareLabel.textContent = "Compartir";
    }, 1600);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title,
      text: `${title} · ${locationName}`,
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus("Compartido");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus("Copiado");
        return;
      }

      window.prompt("Copia este enlace:", shareUrl);
      setShareStatus("Listo");
    } catch {
      setShareStatus("Error");
    }
  };

  if (!stayData) {
    return (
      <main className="stayDetailPage">
        <div className="stayDetailPageShell">
          <article className="stayDetailError">No se encontro informacion del alojamiento.</article>
        </div>
      </main>
    );
  }

  return (
    <main className="stayDetailPage">
      <div className="stayDetailPageShell">
        <header>
          <button className="stayDetailBackBtn" type="button" onClick={() => navigate("/")}>
            ← <span>Volver</span>
          </button>
          <div className="stayDetailTitleRow">
            <h1 className="stayDetailTitle">{title}</h1>
            <div className="stayDetailQuickActions">
              <button className="stayDetailQuickBtn" type="button" onClick={handleShare} id="detailShareBtn">
                ↗ <span id="detailShareLabel">Compartir</span>
              </button>
              <button 
                className={`stayDetailQuickBtn ${isFavorite ? "stayDetailFavoriteActive" : ""}`} 
                type="button" 
                onClick={handleToggleFavorite}
                style={isFavorite ? { color: "#ff815f" } : {}}
              >
                ❤ <span>{isFavorite ? "Guardado" : "Guardar"}</span>
              </button>
            </div>
          </div>
          <p className="stayDetailMeta">
            <span>★ {rating} · 128 reseñas</span>
            <span className="stayDetailDotSep" />
            <span>{locationName}</span>
          </p>
        </header>

        <section className="stayDetailGallery">
          <div className="stayDetailGalleryMain"><img src={gallery[0]} alt="Vista principal del alojamiento" /></div>
          <div className="stayDetailGalleryTile"><img src={gallery[1]} alt="Galeria 1" /></div>
          <div className="stayDetailGalleryTile"><img src={gallery[2]} alt="Galeria 2" /></div>
          <div className="stayDetailGalleryTile"><img src={gallery[3]} alt="Galeria 3" /></div>
          <div className="stayDetailGalleryTile"><img src={gallery[4]} alt="Galeria 4" /></div>
        </section>

        <section className="stayDetailBody">
          <div className="stayDetailLeftCol">
            <article>
              <div className="stayDetailHostingRow">
                <div>
                  <h2>Villa completa, anfitrion: {hostName}</h2>
                  <p>{maxGuests} huespedes <span className="stayDetailDotSep" /> 4 dormitorios <span className="stayDetailDotSep" /> 5 camas <span className="stayDetailDotSep" /> 4.5 baños</p>
                </div>
                <img className="stayDetailHostBadge" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" alt="Perfil del anfitrion" />
              </div>
            </article>

            <article className="stayDetailSection stayDetailFacts">
              {isSuperHost ? (
                <div className="stayDetailFactItem">
                  <span className="stayDetailFactIcon">★</span>
                  <div>
                    <strong>{hostName} es Superhost</strong>
                    <span>Los Superhosts son anfitriones con amplia experiencia y excelentes valoraciones.</span>
                  </div>
                </div>
              ) : null}
              <div className="stayDetailFactItem">
                <span className="stayDetailFactIcon">📍</span>
                <div>
                  <strong>Ubicacion excelente</strong>
                  <span>El 100% de los huespedes recientes califico la ubicacion con 5 estrellas.</span>
                </div>
              </div>
              <div className="stayDetailFactItem">
                <span className="stayDetailFactIcon">✓</span>
                <div>
                  <strong>Cancelacion gratuita por 48 horas</strong>
                  <span>Recibe reembolso total si cambias de opinion dentro de las primeras 48 horas.</span>
                </div>
              </div>
            </article>

            <article className="stayDetailSection">
              <p className="stayDetailDesc">{description}</p>
              <button className="stayDetailShowMore" type="button">Mostrar mas <span>›</span></button>
            </article>

            <article className="stayDetailSection">
              <h3 className="stayDetailReviewsHeader">Comodidades de lujo</h3>
              <div className="stayDetailAmenitiesGrid">
                {amenities.map((item) => (
                  <span className="stayDetailAmenityItem" key={item}>
                    <span className="stayDetailAmenityDot" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </article>

            <article className="stayDetailSection">
              <h3 className="stayDetailReviewsHeader">★ {rating} · 128 reseñas</h3>
              <div className="stayDetailReviewsGrid">
                {defaultReviews.map((review) => (
                  <article className="stayDetailReviewCard" key={review.name}>
                    <div className="stayDetailReviewTop">
                      <img src={review.avatar} alt={review.name} />
                      <div>
                        <strong>{review.name}</strong>
                        <span>{review.date}</span>
                      </div>
                    </div>
                    <p className="stayDetailReviewText">{review.text}</p>
                  </article>
                ))}
              </div>
              <button className="stayDetailMoreBtn" type="button">Ver mas reseñas</button>
            </article>

            <article className="stayDetailSection">
              <h3 className="stayDetailReviewsHeader">Donde estarás</h3>
              <div className="stayDetailLocationMap">
                {panoramaSrc ? (
                  <PanoramaViewer src={panoramaSrc} />
                ) : (
                  <div className="panorama-error">No hay imagen panorámica 360° disponible para este alojamiento.</div>
                )}
                {panoramaSrc && (
                  <button
                    className="panoramaExpandBtn"
                    type="button"
                    onClick={() => setPanoramaOpen(true)}
                  >
                    ⤢ Ver en pantalla completa 360°
                  </button>
                )}
              </div>
              <div className="stayDetailLocationCaption">
                <div>
                  <h4>{locationName}</h4>
                  <p>La villa esta en una de las zonas mas exclusivas, cerca de puntos de interes y rutas escenicas tranquilas.</p>
                </div>
                <button className="stayDetailShowMore" type="button" aria-label="Mas sobre la ubicacion"><span>›</span></button>
              </div>
            </article>
            {panoramaOpen ? (
              <div className="panorama-lightbox" onClick={(e) => { if (e.target === e.currentTarget) setPanoramaOpen(false); }}>
                <button className="panorama-close" type="button" onClick={() => setPanoramaOpen(false)}>Cerrar ✕</button>
                <div className="panorama-lightboxContent">
                  <PanoramaViewer key="lightbox-full" src={panoramaSrc} />
                </div>
              </div>
            ) : null}
          </div>

          <aside className="stayDetailBookingCard">
            <h3 className="stayDetailBookingPrice">${summaryPrice.toLocaleString()} <span>/ noche</span></h3>
            <div className="stayDetailBookingForm">
              <div className="stayDetailBookingDates">
                <div className="stayDetailBookingField">
                  <small>ENTRADA</small>
                  <DatePicker
                    selected={checkInDate}
                    onChange={(date) => {
                      if (date) {
                        setCheckInDate(date);
                        if (checkOutDate <= date) {
                          setCheckOutDate(addDays(date, 1));
                        }
                      }
                    }}
                    selectsStart
                    startDate={checkInDate}
                    endDate={checkOutDate}
                    minDate={new Date()}
                    maxDate={checkOutDate || undefined}
                    locale="es"
                    dateFormat="dd/MM/yyyy"
                    className="stayDetailBookingDateInput"
                    calendarClassName="stayDetailBookingCalendar"
                    popperClassName="stayDetailBookingPopper"
                    placeholderText="Fecha"
                  />
                </div>
                <div className="stayDetailBookingField">
                  <small>SALIDA</small>
                  <DatePicker
                    selected={checkOutDate}
                    onChange={(date) => {
                      if (date) {
                        setCheckOutDate(date);
                      }
                    }}
                    selectsEnd
                    startDate={checkInDate}
                    endDate={checkOutDate}
                    minDate={checkInDate ? addDays(checkInDate, 1) : addDays(new Date(), 1)}
                    locale="es"
                    dateFormat="dd/MM/yyyy"
                    className="stayDetailBookingDateInput"
                    calendarClassName="stayDetailBookingCalendar"
                    popperClassName="stayDetailBookingPopper"
                    placeholderText="Fecha"
                  />
                </div>
              </div>

              <div className="stayDetailBookingGuests">
                <div>
                  <small>HUESPEDES</small>
                  <span className="stayDetailGuestCount">{guestCount} {guestCount === 1 ? "huesped" : "huespedes"}</span>
                </div>
                <div className="stayDetailGuestsStepper">
                  <button type="button" onClick={() => setGuestCount((value) => Math.max(1, value - 1))} disabled={guestCount <= 1} aria-label="Disminuir huespedes">−</button>
                  <span>{guestCount}</span>
                  <button type="button" onClick={() => setGuestCount((value) => Math.min(maxGuestsNumber, value + 1))} disabled={guestCount >= maxGuestsNumber} aria-label="Aumentar huespedes">+</button>
                </div>
              </div>
            </div>

            <button className="stayDetailReserveBtn" type="button" onClick={handleReserve}>Reservar ahora</button>
            <p className="stayDetailSubNote">Aun no se te cobrara</p>

            <div className="stayDetailPriceBreakdown">
              <span className="stayDetailPriceRow"><span>${summaryPrice} x {nights} noches</span><span>${(summaryPrice * nights).toLocaleString()}</span></span>
              <span className="stayDetailPriceRow stayDetailPriceTotal"><span>Total antes de impuestos</span><span>${total.toLocaleString()}</span></span>
            </div>

            <p className="stayDetailPriceTip">Este alojamiento es una joya poco comun. Lugares similares suelen reservarse con meses de anticipacion.</p>
          </aside>
        </section>
      </div>
    </main>
  );
}

export default StayDetailPage;