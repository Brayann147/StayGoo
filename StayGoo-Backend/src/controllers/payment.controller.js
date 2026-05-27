import * as paymentService from '../services/payment.service.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Tu clave secreta desde el .env

/**
 * Payment Controller – Maneja peticiones HTTP para pagos
 */

// POST /api/payments/create-intent → Crea intención de pago en Stripe
export const createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency } = req.body; 
        
        // Creamos la intención de pago
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // El monto en la unidad más pequeña de la divisa (ej. centavos. 1000 = $10.00)
            currency: currency || 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
        });

        // Retornamos el 'client_secret' al frontend para que complete el pago seguro
        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/payments  → Registrar un pago
export const createPayment = async (req, res) => {
    try {
        const paymentData = req.body;
        const data = await paymentService.createPayment(paymentData);
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/payments/:id_payment  → Consultar estado de un pago
export const getPaymentById = async (req, res) => {
    try {
        const { id_payment } = req.params;
        const data = await paymentService.getPaymentById(id_payment);
        res.status(200).json(data);
    } catch (error) {
        res.status(404).json({ error: 'Pago no encontrado.' });
    }
};

// GET /api/payment_method  → Listar métodos de pago
export const getPaymentMethods = async (req, res) => {
    try {
        const data = await paymentService.getPaymentMethods();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
