import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserService } from '../services/UserService';
import { logger } from '../utils/logger';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const user = await this.userService.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  };

  updateMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      }

      const updatedUser = await this.userService.updateUser(req.user.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
      }

      res.json({ status: 'success', data: updatedUser });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  };

  getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await this.userService.getUserProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      res.json({ status: 'success', data: profile });
    } catch (error) {
      next(error);
    }
  };

  getUserRating = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rating = await this.userService.getUserRating(req.params.id);
      res.json({ status: 'success', data: rating });
    } catch (error) {
      next(error);
    }
  };

  incrementCompletedRentals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rating = await this.userService.incrementCompletedRentals(req.params.id);
      res.json({ status: 'success', data: rating });
    } catch (error) {
      next(error);
    }
  };

  applyPublishedReviewAggregate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role, overallScore, categories } = req.body || {};
      if (!role || typeof overallScore !== 'number' || !categories || typeof categories !== 'object') {
        res.status(400).json({
          status: 'error',
          message: 'role, overallScore, categories are required',
        });
        return;
      }

      const rating = await this.userService.applyPublishedReviewAggregate(req.params.id, {
        role,
        overallScore,
        categories,
      });
      res.json({ status: 'success', data: rating });
    } catch (error) {
      next(error);
    }
  };

  listClients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clients = await this.userService.listClients(String(req.query.q || ''));
      res.json(clients);
    } catch (error) {
      next(error);
    }
  };

  getClientById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const client = await this.userService.getClientById(req.params.id);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      res.json(client);
    } catch (error) {
      next(error);
    }
  };

  getClientByPhone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const phone = req.params.phone?.trim();
      if (!phone) {
        return res.status(400).json({ message: 'Phone required' });
      }

      const client = await this.userService.getClientByPhone(phone);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      res.json(client);
    } catch (error) {
      next(error);
    }
  };

  createClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const client = await this.userService.createClient(req.body || {});
      res.status(201).json({ data: client });
    } catch (error) {
      next(error);
    }
  };

  registerOrGetClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const phone = req.body?.phone ? String(req.body.phone).trim() : '';
      const existing = phone ? await this.userService.getClientByPhone(phone) : null;
      const client = await this.userService.registerOrGetClient(req.body || {}, true);
      const statusCode = existing ? 200 : 201;
      res.status(statusCode).json({ data: client });
    } catch (error) {
      next(error);
    }
  };

  updateClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const client = await this.userService.updateClient(req.params.id, req.body || {});
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      res.json({ data: client });
    } catch (error) {
      next(error);
    }
  };

  deleteClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await this.userService.deleteClient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Client not found' });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  createDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const document = await this.userService.createDocument(req.user.id, req.body);
      res.status(201).json({ status: 'success', data: document });
    } catch (error) {
      next(error);
    }
  };

  getDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const documents = await this.userService.getUserDocuments(req.user.id);
      res.json({ status: 'success', data: documents });
    } catch (error) {
      next(error);
    }
  };

  getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const document = await this.userService.getDocumentById(req.params.id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json({ data: document });
    } catch (error) {
      next(error);
    }
  };

  deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      await this.userService.deleteDocument(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  verifyDiia = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // TODO: Implement Дія API integration
      const result = await this.userService.verifyDiia(req.user.id, req.body);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };
}

