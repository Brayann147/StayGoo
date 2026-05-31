import { Router } from 'express';
import { createReview, getReviewsByBooking, getReviewsByHousing } from '../controllers/review.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();



// POST /api/reviews  → Crear review (protegido)
router.post('/', authenticate, createReview);

router.get('/housing/:id_housing', getReviewsByHousing);

// GET /api/reviews/:id_booking  → Listar reviews de un booking (público)
router.get('/:id_booking', getReviewsByBooking);

export default router;

