import { useState } from "react";
import { X, MapPin, Calendar, CreditCard, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { cancelBooking, updateBookingDates } from "../api";
import Swal from "sweetalert2";

const STATUS_CONFIG = {
  confirmed: { label: "Confirmada", bg: "rgba(34,197,94,0.12)", color: "#16a34a", icon: CheckCircle },
  pending:   { label: "Pendiente",  bg: "rgba(234,179,8,0.12)",  color: "#ca8a04", icon: Clock },
  completed: { label: "Completada", bg: "rgba(99,102,241,0.12)", color: "#6366f1", icon: CheckCircle },
  cancelled: { label: "Cancelada",  bg: "rgba(239,68,68,0.12)",  color: "#dc2626", icon: XCircle },
};

export function BookingDetailModal({ reservation, onClose, onUpdated }) {
  const [view, setView] = useState("detail"); // "detail" | "dates"
  const [newStart, setNewStart] = useState(reservation.rawStart || "");
  const [newEnd,   setNewEnd]   = useState(reservation.rawEnd   || "");
  const [saving, setSaving] = useState(false);

  const status = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const canModify = reservation.status !== "cancelled" && reservation.status !== "completed";

  const today = new Date().toISOString().split("T")[0];

  /* ── Cancelar ── */
  const handleCancel = async () => {
    const result = await Swal.fire({
      title: "¿Cancelar reserva?",
      text: "Esta acción no se puede deshacer. La reserva quedará marcada como cancelada.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No, mantenerla",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });
    if (!result.isConfirmed) return;

    setSaving(true);
    try {
      await cancelBooking(reservation.id);
      await Swal.fire({ title: "Reserva cancelada", icon: "success", timer: 1800, showConfirmButton: false });
      onUpdated();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo cancelar la reserva.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Cambiar fechas ── */
  const handleSaveDates = async () => {
    if (!newStart || !newEnd) {
      Swal.fire("Fechas incompletas", "Selecciona ambas fechas.", "warning");
      return;
    }
    if (new Date(newStart) >= new Date(newEnd)) {
      Swal.fire("Fechas inválidas", "La salida debe ser posterior a la llegada.", "warning");
      return;
    }
    setSaving(true);
    try {
      await updateBookingDates(reservation.id, newStart, newEnd);
      await Swal.fire({ title: "¡Fechas actualizadas!", icon: "success", timer: 1800, showConfirmButton: false });
      onUpdated();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudieron actualizar las fechas.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="bookingModalBackdrop"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bookingModalCard" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="bookingModalHeader">
          <div>
            <p className="bookingModalEyebrow">Detalle de reserva</p>
            <h2 className="bookingModalTitle">{reservation.title}</h2>
          </div>
          <button className="bookingModalClose" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Image */}
        <img
          className="bookingModalImage"
          src={reservation.image}
          alt={reservation.title}
        />

        {/* Status badge */}
        <div className="bookingModalStatusRow">
          <span
            className="bookingModalStatusBadge"
            style={{ background: status.bg, color: status.color }}
          >
            <StatusIcon size={14} />
            {status.label}
          </span>
          <span className="bookingModalId">#{reservation.id}</span>
        </div>

        {/* Info grid */}
        <div className="bookingModalInfoGrid">
          <div className="bookingModalInfoItem">
            <MapPin size={15} />
            <div>
              <p>Ubicación</p>
              <span>{reservation.location || "—"}</span>
            </div>
          </div>
          <div className="bookingModalInfoItem">
            <Calendar size={15} />
            <div>
              <p>Fechas</p>
              <span>{reservation.dates}</span>
            </div>
          </div>
          <div className="bookingModalInfoItem">
            <CreditCard size={15} />
            <div>
              <p>Total pagado</p>
              <span>{reservation.totalPrice}</span>
            </div>
          </div>
          <div className="bookingModalInfoItem">
            <Clock size={15} />
            <div>
              <p>Noches</p>
              <span>{reservation.totalNights}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {canModify && (
          <div className="bookingModalTabs">
            <button
              className={view === "detail" ? "active" : ""}
              onClick={() => setView("detail")}
            >
              Acciones
            </button>
            <button
              className={view === "dates" ? "active" : ""}
              onClick={() => setView("dates")}
            >
              Cambiar fechas
            </button>
          </div>
        )}

        {/* Actions view */}
        {view === "detail" && canModify && (
          <div className="bookingModalActions">
            <button
              className="bookingModalDatesBtn"
              onClick={() => setView("dates")}
              disabled={saving}
            >
              <Calendar size={16} /> Cambiar fechas
            </button>
            <button
              className="bookingModalCancelBtn"
              onClick={handleCancel}
              disabled={saving}
            >
              <AlertTriangle size={16} />
              {saving ? "Cancelando…" : "Cancelar reserva"}
            </button>
          </div>
        )}

        {/* Change dates view */}
        {view === "dates" && canModify && (
          <div className="bookingModalDatesForm">
            <div className="bookingModalDateRow">
              <label>
                <span>Llegada</span>
                <input
                  type="date"
                  value={newStart}
                  min={today}
                  onChange={(e) => setNewStart(e.target.value)}
                />
              </label>
              <label>
                <span>Salida</span>
                <input
                  type="date"
                  value={newEnd}
                  min={newStart || today}
                  onChange={(e) => setNewEnd(e.target.value)}
                />
              </label>
            </div>
            <div className="bookingModalDatesActions">
              <button className="bookingModalGhostBtn" onClick={() => setView("detail")}>
                Volver
              </button>
              <button
                className="bookingModalSaveBtn"
                onClick={handleSaveDates}
                disabled={saving}
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        )}

        {/* Cancelled/completed state */}
        {!canModify && (
          <p className="bookingModalNoActions">
            {reservation.status === "cancelled"
              ? "Esta reserva fue cancelada y no puede modificarse."
              : "Esta reserva ya fue completada."}
          </p>
        )}
      </div>
    </div>
  );
}
