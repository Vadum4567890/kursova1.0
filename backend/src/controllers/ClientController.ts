import { Request, Response } from 'express';
import { ClientService } from '../services/ClientService';

/**
 * Controller for client-related endpoints
 */
export class ClientController {
  private clientService: ClientService;

  constructor() {
    this.clientService = new ClientService();
  }

  /**
   * GET /api/clients - Get all clients
   */
  getAllClients = async (req: Request, res: Response): Promise<void> => {
    try {
      const clients = await this.clientService.getAllClients();
      res.json(clients);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/clients/:id - Get client by ID
   */
  getClientById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const client = await this.clientService.getClientById(id);
      
      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }
      
      res.json(client);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/clients/phone/:phone - Get client by phone
   */
  getClientByPhone = async (req: Request, res: Response): Promise<void> => {
    try {
      const phone = req.params.phone;
      const client = await this.clientService.getClientByPhone(phone);
      
      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }
      
      res.json(client);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /api/clients - Create a new client
   */
  createClient = async (req: Request, res: Response): Promise<void> => {
    try {
      const client = await this.clientService.createClient(req.body);
      res.status(201).json({ data: client });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * PUT /api/clients/:id - Update client
   */
  updateClient = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const client = await this.clientService.updateClient(id, req.body);
      res.json({ data: client });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * DELETE /api/clients/:id - Delete client
   */
  deleteClient = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const success = await this.clientService.deleteClient(id);
      
      if (!success) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /api/clients/register - Register or get existing client
   */
  registerOrGetClient = async (req: Request, res: Response): Promise<void> => {
    try {
      const client = await this.clientService.registerOrGetClient(req.body);
      res.status(200).json(client);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

