import { Router } from 'express';
import {
    createBooking,
    getBookingById,
    cancelBooking,
    updateBooking,
    getMyBookings,
    getHostBookings
} from '../controllers/booking.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/bookings/me  → Consultar mis reservas de viajes (protegido)
router.get('/me', authenticate, getMyBookings);

// GET /api/bookings/host  → Consultar las reservas que han hecho a mis alojamientos (protegido)
router.get('/host', authenticate, getHostBookings);

// POST /api/bookings  → Crear reserva (protegido)
router.post('/', authenticate, createBooking);

// GET /api/bookings/:id_booking  → Consultar reserva (protegido)
router.get('/:id_booking', authenticate, getBookingById);

// PUT /api/bookings/:id_booking/cancel  → Cancelar reserva (protegido)
router.put('/:id_booking/cancel', authenticate, cancelBooking);

// PUT /api/bookings/:id_booking  → Cambiar fechas de reserva (protegido)
router.put('/:id_booking', authenticate, updateBooking);

export default router;
