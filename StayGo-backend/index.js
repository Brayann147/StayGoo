import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './src/supabaseClient.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Permite peticiones del frontend
app.use(express.json()); // Permite recibir datos en formato JSON en los POST/PUT

// ==========================================
// 1. ENDPOINTS: Housing (Ejemplo de tu lista)
// ==========================================

// GET /housings -> Listar Housings
app.get('/housings', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('housing')
            .select('*');
        
        if (error) throw error;
        
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /housings -> Publicar un Housing
app.post('/housings', async (req, res) => {
    try {
        const nuevoHousing = req.body;
        
        const { data, error } = await supabase
            .from('housing')
            .insert([nuevoHousing])
            .select();
            
        if (error) throw error;
        
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// Iniciar el servidor
// ==========================================
app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});
