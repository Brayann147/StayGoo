import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes         from './src/routes/auth.routes.js';
import userRoutes         from './src/routes/user.routes.js';
import housingRoutes      from './src/routes/housing.routes.js';
import housingImagesRoutes from './src/routes/housingImages.routes.js';
import availabilityRoutes from './src/routes/availability.routes.js';
import serviceRoutes      from './src/routes/service.routes.js';
import bookingRoutes      from './src/routes/booking.routes.js';
import paymentRoutes      from './src/routes/payment.routes.js';
import reviewRoutes       from './src/routes/review.routes.js';
import notificationRoutes from './src/routes/notification.routes.js';
import messageRoutes      from './src/routes/message.routes.js';
import documentsRoutes    from './src/routes/documents.routes.js';
import citiesRoutes       from './src/routes/cities.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/housings',      housingRoutes);
app.use('/api/housings',      housingImagesRoutes);
app.use('/api/availability',  availabilityRoutes);
app.use('/api/services',      serviceRoutes);
app.use('/api/bookings',      bookingRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/reviews',       reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/documents',     documentsRoutes);
app.use('/api/cities',        citiesRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'StayGo Backend is running' });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Ruta ${req.method} ${req.originalUrl} no encontrada.` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('❌ Error no controlado:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ StayGo Backend corriendo en http://localhost:${PORT}`);
    console.log(`\n📌 Endpoints disponibles:`);
    console.log(`   Auth:          /api/auth`);
    console.log(`   Users:         /api/users`);
    console.log(`   Housings:      /api/housings`);
    console.log(`   Availability:  /api/availability`);
    console.log(`   Services:      /api/services`);
    console.log(`   Bookings:      /api/bookings`);
    console.log(`   Payments:      /api/payments`);
    console.log(`   Reviews:       /api/reviews`);
    console.log(`   Notifications: /api/notifications`);
    console.log(`   Messages:      /api/messages`);
    console.log(`   Documents:     /api/documents`);
});
