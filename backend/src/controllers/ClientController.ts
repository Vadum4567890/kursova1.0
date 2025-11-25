import { Request, Response } from 'express';
import { IClientService } from '../core/interfaces/IClientService';
import { CreateClientDto, UpdateClientDto, RegisterClientDto } from '../dto/requests/ClientRequest.dto';
import { ClientMapper } from '../dto/mappers/ClientMapper';

/**
 * Controller for client-related endpoints
 * Uses Dependency Injection for services
 */
export class ClientController {
  constructor(private clientService: IClientService) {}

  /**
   * GET /api/clients - Get all clients
   */
  getAllClients = async (req: Request, res: Response): Promise<void> => {
    try {
      const clients = await this.clientService.getAllClients();
      const clientsDto = ClientMapper.toResponseDtoList(clients);
      res.json(clientsDto);
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
      
      const clientDto = ClientMapper.toResponseDto(client);
      res.json(clientDto);
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
      
      const clientDto = ClientMapper.toResponseDto(client);
      res.json(clientDto);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /api/clients - Create a new client
   */
  createClient = async (req: Request, res: Response): Promise<void> => {
    try {
      const createClientDto: CreateClientDto = req.body;
      const clientEntity = ClientMapper.fromCreateDto(createClientDto);
      const client = await this.clientService.createClient(clientEntity);
      const clientDto = ClientMapper.toResponseDto(client);
      res.status(201).json({ data: clientDto });
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
      const updateClientDto: UpdateClientDto = req.body;
      const clientEntity = ClientMapper.fromUpdateDto(updateClientDto);
      const client = await this.clientService.updateClient(id, clientEntity);
      const clientDto = ClientMapper.toResponseDto(client);
      res.json({ data: clientDto });
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
      const registerClientDto: RegisterClientDto = req.body;
      const client = await this.clientService.registerOrGetClient(registerClientDto);
      const clientDto = ClientMapper.toResponseDto(client);
      res.status(200).json(clientDto);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

