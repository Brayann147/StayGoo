import * as reviewService from '../services/review.service.js';

/**
 * Review Controller – Maneja peticiones HTTP para reseñas
 */

// POST /api/reviews  → Registrar una review
export const createReview = async (req, res) => {
    try {
        const reviewData = req.body;
        const data = await reviewService.createReview(reviewData);
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/reviews  → Listar todas las reviews o filtradas por query params (ej: housing_id)
export const getReviews = async (req, res) => {
    try {
        const { housing_id } = req.query;
        if (housing_id) {
            const data = await reviewService.getReviewsByHousing(housing_id);
            return res.status(200).json(data);
        }
        res.status(400).json({ error: "Debe especificar housing_id en la consulta." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/reviews/:id_booking  → Listar reviews de un booking
export const getReviewsByBooking = async (req, res) => {
    try {
        const { id_booking } = req.params;
        const data = await reviewService.getReviewsByBooking(id_booking);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
export const getReviewsByHousing = async (req, res) => {
    try {
        const { id_housing } = req.params;
        const data = await reviewService.getReviewsByHousing(id_housing);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

