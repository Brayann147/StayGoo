import { Router } from 'express';
import { getUserById, updateUser, getRoles, getMyProfile, uploadAvatar, uploadAvatarMiddleware } from '../controllers/user.controller.js';
import { register } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/users  → Registrar nuevo usuario (público)
router.post('/', register);

// GET /api/users/me  → Consultar perfil propio (protegido)
router.get('/me', authenticate, getMyProfile);

// POST /api/users/me/avatar  → Subir foto de perfil (protegido)
router.post('/me/avatar', authenticate, uploadAvatarMiddleware.single('avatar'), uploadAvatar);

// GET /api/users/:id_user  → Consultar perfil (público)
router.get('/:id_user', getUserById);

// PUT /api/users/:id_user  → Actualizar perfil (protegido)
router.put('/:id_user', authenticate, updateUser);

// GET /api/roles  → Listar roles disponibles (público)
router.get('/roles/list', getRoles);

export default router;

