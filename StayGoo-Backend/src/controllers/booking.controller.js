import * as bookingService from '../services/booking.service.js';

/**
 * Booking Controller – Maneja peticiones HTTP para reservas
 */

// POST /api/bookings  → Crear una reserva
export const createBooking = async (req, res) => {
    try {
        const bookingData = { ...req.body, id_user: req.user.id };
        const data = await bookingService.createBooking(bookingData);
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/bookings/:id_booking  → Consultar una reserva
export const getBookingById = async (req, res) => {
    try {
        const { id_booking } = req.params;
        const data = await bookingService.getBookingById(id_booking);
        res.status(200).json(data);
    } catch (error) {
        res.status(404).json({ error: 'Reserva no encontrada.' });
    }
};

// PUT /api/bookings/:id_booking/cancel  → Cancelar una reserva
export const cancelBooking = async (req, res) => {
    try {
        const { id_booking } = req.params;
        const data = await bookingService.cancelBooking(id_booking);
        res.status(200).json({ message: 'Reserva cancelada.', data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/bookings/me
export const getMyBookings = async (req, res) => {
    try {
        const data = await bookingService.getMyBookings(req.user.id);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/bookings/host
export const getHostBookings = async (req, res) => {
    try {
        const data = await bookingService.getHostBookings(req.user.id);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// GET /api/bookings/housing/:id_housing  → Fechas bloqueadas de un alojamiento (público)
export const getBookingsByHousing = async (req, res) => {
    try {
        const { id_housing } = req.params;
        const data = await bookingService.getBookingsByHousing(id_housing);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PUT /api/bookings/:id_booking  → Actualizar fechas de reserva
export const updateBooking = async (req, res) => {
    try {
        const { id_booking } = req.params;
        const { start_date, end_date } = req.body;
        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Se requieren start_date y end_date.' });
        }
        if (new Date(start_date) >= new Date(end_date)) {
            return res.status(400).json({ error: 'La fecha de salida debe ser posterior a la de llegada.' });
        }
        const data = await bookingService.updateBooking(id_booking, { start_date, end_date });
        res.status(200).json({ message: 'Fechas actualizadas.', data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
