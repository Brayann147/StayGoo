import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck, Star } from "lucide-react";
import { useAuthUser } from "../useAuthUser";
import { getMyBookings, createReview } from "../api";
import Swal from "sweetalert2";

export function TripsSection() {
  const user = useAuthUser();
  const [activeReservation, setActiveReservation] = useState(0);
  const [isImageFading, setIsImageFading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);

  useEffect(() => {
    async function loadBookings() {
      try {
        const data = await getMyBookings();
        if (data && Array.isArray(data)) {
            setMyBookings(data);
        }
      } catch (error) {
        console.error("Error al cargar mis reservas de viaje:", error);
      }
    }
    loadBookings();
  }, []);

  const programmedReservations = myBookings.length > 0 ? myBookings.map(b => {
    const start = b.start_date ? new Date(b.start_date) : new Date();
    const end = b.end_date ? new Date(b.end_date) : new Date();
    
    let startStr = "TBD";
    let endStr = "TBD";
    try {
        startStr = start.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
        endStr = end.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    } catch(e){}
    
    let diffDays = Math.ceil((start - new Date()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) diffDays = 0;

    // Obtener imagen real del alojamiento (la primera no-panorama)
    const images = b.housing?.housing_images || [];
    const normalImages = images.filter(img => !img.is_panorama);
    const coverImage = normalImages.length > 0
      ? normalImages[0].image_url
      : "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1400&q=80";

    // Ubicación
    const location = [b.housing?.municipality, b.housing?.department, b.housing?.country]
      .filter(Boolean).join(', ');

    return {
      id: b.id_booking,
      title: b.housing?.name || "Alojamiento",
      location: location || b.housing?.address || "",
      dates: `${startStr} - ${endStr}`,
      status: b.status,
      image: coverImage,
      countdown: { days: String(diffDays).padStart(2, "0"), hrs: "00", min: "00" }
    };
  }) : [
    {
      id: "no-res",
      title: "No tienes reservas aún",
      location: "",
      dates: "Planea tu próximo destino con nosotros",
      status: null,
      image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1400&q=80",
      countdown: { days: "0", hrs: "0", min: "0" }
    }
  ];


  const hasCarousel = programmedReservations.length > 1;
  const currentReservation = programmedReservations[activeReservation] || programmedReservations[0];

  const changeReservation = (computeNextIndex) => {
    if (isImageFading) {
      return;
    }

    setIsImageFading(true);

    window.setTimeout(() => {
      setActiveReservation(computeNextIndex);

      window.requestAnimationFrame(() => {
        setIsImageFading(false);
      });
    }, 190);
  };

  const goToPrevious = () => {
    changeReservation((prev) =>
      prev === 0 ? programmedReservations.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    changeReservation((prev) => (prev + 1) % programmedReservations.length);
  };

  const handleWriteReview = async (res) => {
    const { value: formValues } = await Swal.fire({
      title: 'Escribir reseña',
      html:
        '<div style="text-align:left; font-family: sans-serif;">' +
        '<label style="display:block;margin-bottom:5px;font-weight:600;font-size:14px;color:#333;">Calificación (1-5 estrellas):</label>' +
        '<select id="swal-rating" class="swal2-input" style="margin-bottom:15px; width:100%; box-sizing:border-box; border-radius:8px;">' +
          '<option value="5">★★★★★ (5 - Excelente)</option>' +
          '<option value="4">★★★★☆ (4 - Muy bueno)</option>' +
          '<option value="3">★★★☆☆ (3 - Promedio)</option>' +
          '<option value="2">★★☆☆☆ (2 - Malo)</option>' +
          '<option value="1">★☆☆☆☆ (1 - Horrible)</option>' +
        '</select>' +
        '<label style="display:block;margin-bottom:5px;font-weight:600;font-size:14px;color:#333;">Comentario:</label>' +
        '<textarea id="swal-comment" class="swal2-textarea" placeholder="Cuéntanos tu experiencia sobre este alojamiento..." style="width:100%;height:100px;margin:0;box-sizing:border-box;border-radius:8px;"></textarea>' +
        '</div>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Enviar reseña',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ff385c',
      preConfirm: () => {
        const ratingVal = parseInt(document.getElementById('swal-rating').value, 10);
        const commentVal = document.getElementById('swal-comment').value;
        if (!ratingVal || ratingVal < 1 || ratingVal > 5) {
          Swal.showValidationMessage('La calificación debe ser entre 1 y 5');
          return false;
        }
        if (!commentVal.trim()) {
          Swal.showValidationMessage('El comentario no puede estar vacío');
          return false;
        }
        return { rating: ratingVal, comment: commentVal };
      }
    });

    if (formValues) {
      try {
        await createReview({
          id_booking: res.id,
          rating: formValues.rating,
          comment: formValues.comment,
          date: new Date().toISOString().split('T')[0]
        });
        Swal.fire('¡Gracias!', 'Tu reseña ha sido guardada con éxito.', 'success');
      } catch (err) {
        console.error("Error al enviar la reseña:", err);
        Swal.fire('Error', err.message || 'No se pudo guardar la reseña.', 'error');
      }
    }
  };

  // Safe fallback if user.name contains "undefined"
  const displayName = (typeof user?.name === "string" && !user.name.includes("undefined")) ? user.name : "Viajero";

  return (
    <>
      <header className="memberWelcome">
        <h1>
          Bienvenido de nuevo, <span>{displayName}</span>
        </h1>
      </header>

      <section className="memberTopGrid">
        <article className="memberSpotlightCard">
          <img
            className={`spotlightImage ${isImageFading ? "isFading" : ""}`}
            key={currentReservation.id}
            src={currentReservation.image}
            alt={currentReservation.title}
          />

          {hasCarousel ? (
            <div
              className="spotlightCarouselControls"
              aria-label="Controles del carrusel"
            >
              <button
                type="button"
                onClick={goToPrevious}
                aria-label="Reserva anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={goToNext}
                aria-label="Siguiente reserva"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ) : null}

          <aside className="quickTagPanel">
            <h3>Acciones rápidas</h3>
            <button type="button">
              <span>
                <ShieldCheck size={14} /> Contactar host
              </span>
              <ChevronRight size={16} />
            </button>
            {currentReservation.id !== "no-res" && (
              <button type="button" onClick={() => handleWriteReview(currentReservation)}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <Star size={14} style={{ fill: '#ff385c', stroke: '#ff385c', marginRight: '6px' }} /> Escribir reseña
                </span>
                <ChevronRight size={16} />
              </button>
            )}
          </aside>

          <div className="spotlightOverlay">
            <div className="spotlightInfo">
              <small>PRÓXIMA EXPERIENCIA</small>
              <h3>{currentReservation?.title}</h3>
              {currentReservation?.location && (
                <p style={{ fontSize: '13px', opacity: 0.8, margin: '2px 0 0' }}>
                  📍 {currentReservation.location}
                </p>
              )}

              <div className="spotlightMetaRow">
                <p>{currentReservation?.dates}</p>
                {currentReservation?.status && currentReservation.id !== "no-res" && (
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    background:
                      currentReservation.status === 'confirmed' ? 'rgba(34,197,94,0.85)' :
                      currentReservation.status === 'completed' ? 'rgba(99,102,241,0.85)' :
                      currentReservation.status === 'pending'   ? 'rgba(234,179,8,0.85)' :
                                                                  'rgba(239,68,68,0.85)',
                    color: '#fff'
                  }}>
                    {currentReservation.status === 'confirmed' ? '✅ Confirmada' :
                     currentReservation.status === 'completed' ? '✔️ Completada' :
                     currentReservation.status === 'pending'   ? '⏳ Pendiente' :
                                                                 '❌ Cancelada'}
                  </span>
                )}

                {hasCarousel ? (
                  <div className="spotlightDots" aria-hidden="true">
                    {programmedReservations.map((reservation, index) => (
                      <span
                        className={index === activeReservation ? "isActive" : ""}
                        key={reservation.id}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>


            {currentReservation.id !== "no-res" && (
                <div className="spotlightCountdown">
                <div>
                    <strong>{currentReservation?.countdown?.days}</strong>
                    <span>Días</span>
                </div>
                <div>
                    <strong>{currentReservation?.countdown?.hrs}</strong>
                    <span>Horas</span>
                </div>
                <div>
                    <strong>{currentReservation?.countdown?.min}</strong>
                    <span>Minutos</span>
                </div>
                </div>
            )}
          </div>
        </article>
      </section>
    </>
  );
}
