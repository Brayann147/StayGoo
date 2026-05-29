import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import "./StayDetailPage.css";
import PanoramaViewer from "./PanoramaViewer";
import { getHousingById, getReviewsByHousing } from "./api";
import {
  isFavorite as isListingFavorite,
  toggleFavoriteId,
  FAVORITES_CHANGED_EVENT,
} from "./utils/favoritesStorage";
import { formatCurrencyPrice } from "./utils/listingMapper";

registerLocale("es", es);

const mapRealReview = (r) => {
  let formattedDate = "Reciente";
  if (r.date) {
    try {
      const d = new Date(r.date);
      const options = { month: "long", year: "numeric" };
      formattedDate = d.toLocaleDateString("es-ES", options);
      formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    } catch (e) {}
  }
  return {
    name: r.booking?.user?.name || "Huésped de StayGo",
    date: formattedDate,
    text: r.comment || "",
    rating: r.rating || 5,
    avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80`
  };
};

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
  // Prioridad 1: housing_images del API (array completo con todos los objetos)
  if (Array.isArray(stay.housing_images) && stay.housing_images.length > 0) {
    const normal = stay.housing_images
      .filter(img => !img.is_panorama)
      .map(img => img.image_url)
      .filter(Boolean);
    if (normal.length > 0) {
      return Array.from(new Set(normal));
    }
  }

  // Prioridad 2: Fallback a campos sueltos (cuando aún no llegó el fetch del API)
  const source = [];
  if (stay.image && !stay.image.includes('unsplash')) {
    source.push(stay.image);
  }
  if (stay.coverImage && !stay.coverImage.includes('unsplash')) {
    source.push(stay.coverImage);
  }
  if (Array.isArray(stay.gallery)) {
    const validGallery = stay.gallery.filter(g => typeof g === 'string' && !g.includes('unsplash'));
    source.push(...validGallery);
  }

  const unique = Array.from(new Set(source.filter(Boolean)));
  return unique.slice(0, 5);
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
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [reviews, setReviews] = useState([]);

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
            const firstImage = normalImages.length > 0 ? normalImages[0].image_url : "";

            setStay(prev => ({
              ...prev,
              ...latest,
              title: latest.name || prev.title,
              location: latest.address ? `${latest.address}, ${latest.city}` : latest.city || prev.location,
              maxGuests: latest.capacity || prev.maxGuests,
              price: `${formatCurrencyPrice(latest.price_per_night, latest.currency)}/noche`,
              image: firstImage,
              housing_images: images  // ← Array completo con TODAS las fotos normales y panorámicas
            }));
          }

          // Fetch real reviews
          try {
            const fetched = await getReviewsByHousing(id);
            if (Array.isArray(fetched)) {
              setReviews(fetched);
            }
          } catch (err) {
            console.error("Error fetching reviews:", err);
          }
        } catch (err) {
          console.error("Error fetching latest stay details:", err);
        } finally {
          setImagesLoaded(true);  // ← Marcar como cargado aunque haya error
        }
      } else {
        // Sin ID para buscar: usar datos del URL directamente
        setImagesLoaded(true);
      }
    };
    setImagesLoaded(false);  // ← Resetear al cambiar alojamiento
    setReviews([]);          // ← Resetear reseñas al cambiar alojamiento
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
  const reviewCount = reviews.length;
  const computedRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    return (totalRating / reviews.length).toFixed(1);
  }, [reviews]);
  const rating = computedRating ? String(computedRating) : "Nuevo";
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
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index = 0) => {
    setLightboxIndex(index);
    setShowAllPhotos(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setShowAllPhotos(false);
    document.body.style.overflow = "";
  };

  const lightboxPrev = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
  };

  const lightboxNext = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
  };

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
            <span>
              ★ {rating === "Nuevo" ? "Nuevo" : `${rating} · ${reviewCount} ${reviewCount === 1 ? "reseña" : "reseñas"}`}
            </span>
            <span className="stayDetailDotSep" />
            <span>{locationName}</span>
          </p>
        </header>

        {!imagesLoaded ? (
          <section className="stayDetailGallery stayDetailGallerySkeleton">
            <div className="stayDetailGalleryMain stayDetailSkeletonBlock" />
            <div className="stayDetailGalleryTile stayDetailSkeletonBlock" />
            <div className="stayDetailGalleryTile stayDetailSkeletonBlock" />
            <div className="stayDetailGalleryTile stayDetailSkeletonBlock" />
            <div className="stayDetailGalleryTile stayDetailSkeletonBlock" />
          </section>
        ) : gallery.length > 0 ? (
          <section className={`stayDetailGallery ${gallery.length === 1 ? "stayDetailGallerySingle" : gallery.length < 5 ? "stayDetailGalleryPartial" : ""}`}>
            {/* Imagen principal grande */}
            <div className="stayDetailGalleryMain" onClick={() => openLightbox(0)}>
              {gallery[0] ? <img src={gallery[0]} alt="Vista principal del alojamiento" /> : null}
            </div>

            {/* Grid derecho 2x2 */}
            {gallery[1] && (
              <div className="stayDetailGalleryTile" onClick={() => openLightbox(1)}>
                <img src={gallery[1]} alt="Galería foto 2" />
              </div>
            )}
            {gallery[2] && (
              <div className="stayDetailGalleryTile" onClick={() => openLightbox(2)}>
                <img src={gallery[2]} alt="Galería foto 3" />
              </div>
            )}
            {gallery[3] && (
              <div className="stayDetailGalleryTile" onClick={() => openLightbox(3)}>
                <img src={gallery[3]} alt="Galería foto 4" />
              </div>
            )}
            {gallery[4] ? (
              <div className="stayDetailGalleryTile stayDetailGalleryLastTile" onClick={() => openLightbox(4)}>
                <img src={gallery[4]} alt="Galería foto 5" />
                <button
                  className="stayDetailShowAllBtn"
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
                  aria-label="Mostrar todas las fotos"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  Mostrar todas las fotos
                </button>
              </div>
            ) : gallery.length >= 2 ? (
              /* Si hay menos de 5 fotos, mostrar el botón en la última tile */
              <div className="stayDetailGalleryTile stayDetailGalleryLastTile" onClick={() => openLightbox(gallery.length - 1)}>
                <img src={gallery[gallery.length - 1]} alt="Galería última foto" />
                <button
                  className="stayDetailShowAllBtn"
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
                  aria-label="Mostrar todas las fotos"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  Mostrar todas las fotos
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* ── Lightbox de galería completa ── */}
        {showAllPhotos && (
          <div className="stayGalleryLightbox" onClick={closeLightbox}>
            <div className="stayGalleryLightboxInner" onClick={(e) => e.stopPropagation()}>
              <div className="stayGalleryLightboxTopBar">
                <button className="stayGalleryLightboxClose" type="button" onClick={closeLightbox} aria-label="Cerrar galería">
                  ✕
                </button>
                <span className="stayGalleryLightboxCounter">{lightboxIndex + 1} / {gallery.length}</span>
              </div>

              <div className="stayGalleryLightboxStage">
                <button className="stayGalleryNavBtn stayGalleryNavPrev" type="button" onClick={lightboxPrev} aria-label="Foto anterior" disabled={gallery.length <= 1}>
                  ‹
                </button>
                <img
                  key={lightboxIndex}
                  src={gallery[lightboxIndex]}
                  alt={`Foto ${lightboxIndex + 1} de ${gallery.length}`}
                  className="stayGalleryLightboxImg"
                />
                <button className="stayGalleryNavBtn stayGalleryNavNext" type="button" onClick={lightboxNext} aria-label="Foto siguiente" disabled={gallery.length <= 1}>
                  ›
                </button>
              </div>

              <div className="stayGalleryThumbs">
                {gallery.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`stayGalleryThumb ${i === lightboxIndex ? "isActive" : ""}`}
                    onClick={() => setLightboxIndex(i)}
                    aria-label={`Ver foto ${i + 1}`}
                  >
                    <img src={src} alt={`Miniatura ${i + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
              <h3 className="stayDetailReviewsHeader">
                {rating === "Nuevo" ? "★ Sin reseñas" : `★ ${rating} · ${reviewCount} ${reviewCount === 1 ? "reseña" : "reseñas"}`}
              </h3>
              {reviews.length > 0 ? (
                <div className="stayDetailReviewsGrid">
                  {reviews.map((r, i) => {
                    const mapped = mapRealReview(r);
                    return (
                      <article className="stayDetailReviewCard" key={r.id_review || i}>
                        <div className="stayDetailReviewTop">
                          <img src={mapped.avatar} alt={mapped.name} />
                          <div>
                            <strong>{mapped.name}</strong>
                            <span>{mapped.date}</span>
                          </div>
                        </div>
                        <p className="stayDetailReviewText">{mapped.text}</p>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: "#666", fontSize: "0.95rem", margin: "10px 0" }}>
                  Este alojamiento aún no tiene reseñas escritas por usuarios reales.
                </p>
              )}
              {reviews.length > 6 && (
                <button className="stayDetailMoreBtn" type="button">Ver mas reseñas</button>
              )}
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
            <h3 className="stayDetailBookingPrice">{formatCurrencyPrice(summaryPrice, stay.currency)} <span>/ noche</span></h3>
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
              <span className="stayDetailPriceRow">
                <span>{formatCurrencyPrice(summaryPrice, stay.currency)} x {nights} {nights === 1 ? "noche" : "noches"}</span>
                <span>{formatCurrencyPrice(summaryPrice * nights, stay.currency)}</span>
              </span>
              <span className="stayDetailPriceRow stayDetailPriceTotal">
                <span>Total antes de impuestos</span>
                <span>{formatCurrencyPrice(total, stay.currency)}</span>
              </span>
            </div>

            <p className="stayDetailPriceTip">Este alojamiento es una joya poco comun. Lugares similares suelen reservarse con meses de anticipacion.</p>
          </aside>
        </section>
      </div>
    </main>
  );
}

export default StayDetailPage;