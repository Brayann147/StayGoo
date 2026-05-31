import { Router } from 'express';
import { getCities } from '../controllers/cities.controller.js';

const router = Router();

router.get('/', getCities);

export default router;