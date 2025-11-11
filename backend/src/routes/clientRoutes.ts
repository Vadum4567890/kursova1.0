import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';

const router = Router();
const clientController = new ClientController();

router.get('/', clientController.getAllClients);
router.get('/phone/:phone', clientController.getClientByPhone);
router.get('/:id', clientController.getClientById);
router.post('/', clientController.createClient);
router.post('/register', clientController.registerOrGetClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

export default router;

