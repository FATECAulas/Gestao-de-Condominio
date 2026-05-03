import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as garageDrawService from './garageDrawService';
import * as db from './db';

// Mock do módulo db
vi.mock('./db', () => ({
  getAllUsers: vi.fn(),
  getAllGarages: vi.fn(),
  getAvailableSortableGarages: vi.fn(),
  getUserById: vi.fn(),
  getGarageById: vi.fn(),
  updateGarage: vi.fn(),
  createGarageDraw: vi.fn(),
}));

describe('Garage Draw Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('performGarageDraw', () => {
    it('deve retornar array vazio quando não há garagens disponíveis', async () => {
      vi.mocked(db.getAllUsers).mockResolvedValue([
        { id: 1, name: 'User 1', role: 'user' } as any,
      ]);
      vi.mocked(db.getAvailableSortableGarages).mockResolvedValue([]);

      const result = await garageDrawService.performGarageDraw();

      expect(result).toEqual([]);
    });

    it('deve retornar array vazio quando não há usuários elegíveis', async () => {
      vi.mocked(db.getAllUsers).mockResolvedValue([
        { id: 1, name: 'Admin', role: 'admin' } as any,
      ]);
      vi.mocked(db.getAvailableSortableGarages).mockResolvedValue([
        { id: 1, garageNumber: 'G1', type: 'sortable' } as any,
      ]);

      const result = await garageDrawService.performGarageDraw();

      expect(result).toEqual([]);
    });

    it('deve atribuir garagens a usuários elegíveis', async () => {
      const mockUsers = [
        { id: 1, name: 'User 1', role: 'user' } as any,
        { id: 2, name: 'User 2', role: 'user' } as any,
      ];
      const mockGarages = [
        { id: 1, garageNumber: 'G1', type: 'sortable' } as any,
        { id: 2, garageNumber: 'G2', type: 'sortable' } as any,
      ];

      vi.mocked(db.getAllUsers).mockResolvedValue(mockUsers);
      vi.mocked(db.getAvailableSortableGarages).mockResolvedValue(mockGarages);
      vi.mocked(db.updateGarage).mockResolvedValue(undefined);
      vi.mocked(db.createGarageDraw).mockResolvedValue(undefined);

      const result = await garageDrawService.performGarageDraw();

      expect(result.length).toBeGreaterThan(0);
      expect(result.some(r => r.result === 'won')).toBe(true);
      expect(vi.mocked(db.updateGarage).mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('assignFixedGarage', () => {
    it('deve atribuir garagem fixa a síndico', async () => {
      const mockUser = { id: 1, name: 'Síndico', role: 'sindico' } as any;
      const mockGarage = { id: 1, garageNumber: 'G1', type: 'fixed' } as any;

      vi.mocked(db.getUserById).mockResolvedValue(mockUser);
      vi.mocked(db.getGarageById).mockResolvedValue(mockGarage);
      vi.mocked(db.updateGarage).mockResolvedValue(undefined);

      const result = await garageDrawService.assignFixedGarage(1, 1);

      expect(result).toBe(true);
      expect(vi.mocked(db.updateGarage)).toHaveBeenCalledWith(1, { assignedUserId: 1 });
    });

    it('deve rejeitar atribuição de garagem fixa a usuário comum', async () => {
      const mockUser = { id: 1, name: 'User', role: 'user' } as any;
      const mockGarage = { id: 1, garageNumber: 'G1', type: 'fixed' } as any;

      vi.mocked(db.getUserById).mockResolvedValue(mockUser);
      vi.mocked(db.getGarageById).mockResolvedValue(mockGarage);

      const result = await garageDrawService.assignFixedGarage(1, 1);

      expect(result).toBe(false);
    });

    it('deve rejeitar atribuição de garagem não-fixa', async () => {
      const mockUser = { id: 1, name: 'Síndico', role: 'sindico' } as any;
      const mockGarage = { id: 1, garageNumber: 'G1', type: 'sortable' } as any;

      vi.mocked(db.getUserById).mockResolvedValue(mockUser);
      vi.mocked(db.getGarageById).mockResolvedValue(mockGarage);

      const result = await garageDrawService.assignFixedGarage(1, 1);

      expect(result).toBe(false);
    });
  });

  describe('assignPredeterminedGarage', () => {
    it('deve atribuir garagem pré-determinada', async () => {
      const mockUser = { id: 1, name: 'User', role: 'user' } as any;
      const mockGarage = { id: 1, garageNumber: 'G1', type: 'predetermined' } as any;

      vi.mocked(db.getUserById).mockResolvedValue(mockUser);
      vi.mocked(db.getGarageById).mockResolvedValue(mockGarage);
      vi.mocked(db.updateGarage).mockResolvedValue(undefined);

      const result = await garageDrawService.assignPredeterminedGarage(1, 1);

      expect(result).toBe(true);
      expect(vi.mocked(db.updateGarage)).toHaveBeenCalledWith(1, { assignedUserId: 1 });
    });

    it('deve rejeitar atribuição de garagem não pré-determinada', async () => {
      const mockUser = { id: 1, name: 'User', role: 'user' } as any;
      const mockGarage = { id: 1, garageNumber: 'G1', type: 'sortable' } as any;

      vi.mocked(db.getUserById).mockResolvedValue(mockUser);
      vi.mocked(db.getGarageById).mockResolvedValue(mockGarage);

      const result = await garageDrawService.assignPredeterminedGarage(1, 1);

      expect(result).toBe(false);
    });
  });

  describe('releaseGarage', () => {
    it('deve liberar garagem removendo atribuição', async () => {
      const mockGarage = { id: 1, garageNumber: 'G1', type: 'sortable', assignedUserId: 1 } as any;

      vi.mocked(db.getGarageById).mockResolvedValue(mockGarage);
      vi.mocked(db.updateGarage).mockResolvedValue(undefined);

      const result = await garageDrawService.releaseGarage(1);

      expect(result).toBe(true);
      expect(vi.mocked(db.updateGarage)).toHaveBeenCalledWith(1, { assignedUserId: null });
    });

    it('deve retornar false se garagem não existe', async () => {
      vi.mocked(db.getGarageById).mockResolvedValue(null);

      const result = await garageDrawService.releaseGarage(999);

      expect(result).toBe(false);
    });
  });
});
