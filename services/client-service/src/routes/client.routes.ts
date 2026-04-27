import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';

const router = Router();
const c = new ClientController();

router.get('/phone/:phone', c.getByPhone);
router.post('/register', c.registerOrGet);
router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
