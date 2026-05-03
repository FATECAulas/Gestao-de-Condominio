import * as db from "./db";

/**
 * Serviço de sorteio de garagens
 * Implementa lógica de sorteio respeitando garagens fixas e pré-determinadas
 */

export interface DrawResult {
  userId: number;
  garageId: number;
  result: 'won' | 'lost' | 'skipped';
}

/**
 * Realiza sorteio de garagens para condôminos elegíveis
 * Respeita garagens fixas (síndico/subsíndico) e pré-determinadas (1 veículo)
 */
export async function performGarageDraw(): Promise<DrawResult[]> {
  const users = await db.getAllUsers();
  const garages = await db.getAllGarages();
  const sortableGarages = await db.getAvailableSortableGarages();

  // Filtrar usuários elegíveis (condôminos comuns)
  const eligibleUsers = users.filter(u => u.role === 'user');

  if (sortableGarages.length === 0 || eligibleUsers.length === 0) {
    return [];
  }

  const results: DrawResult[] = [];
  const shuffledUsers = shuffleArray([...eligibleUsers]);
  const shuffledGarages = shuffleArray([...sortableGarages]);

  // Realizar sorteio
  for (let i = 0; i < shuffledUsers.length; i++) {
    const user = shuffledUsers[i];
    const garage = shuffledGarages[i];

    if (!garage) {
      // Não há garagem disponível para este usuário
      results.push({
        userId: user.id,
        garageId: 0,
        result: 'skipped',
      });
      continue;
    }

    // Registrar sorteio
    const result: DrawResult = {
      userId: user.id,
      garageId: garage.id,
      result: 'won',
    };

    // Atualizar garagem com usuário
    await db.updateGarage(garage.id, { assignedUserId: user.id });

    // Registrar no histórico
    await db.createGarageDraw({
      drawDate: new Date(),
      garageId: garage.id,
      userId: user.id,
      result: 'won',
    });

    results.push(result);
  }

  // Registrar usuários que não ganharam garagem
  for (let i = shuffledGarages.length; i < shuffledUsers.length; i++) {
    const user = shuffledUsers[i];
    const randomGarage = shuffledGarages[0];

    if (randomGarage) {
      await db.createGarageDraw({
        drawDate: new Date(),
        garageId: randomGarage.id,
        userId: user.id,
        result: 'lost',
      });

      results.push({
        userId: user.id,
        garageId: randomGarage.id,
        result: 'lost',
      });
    }
  }

  return results;
}

/**
 * Atribui garagem fixa a síndico/subsíndico
 */
export async function assignFixedGarage(userId: number, garageId: number): Promise<boolean> {
  const user = await db.getUserById(userId);
  const garage = await db.getGarageById(garageId);

  if (!user || !garage) return false;
  if (user.role !== 'sindico' && user.role !== 'subsindico') return false;
  if (garage.type !== 'fixed') return false;

  await db.updateGarage(garageId, { assignedUserId: userId });
  return true;
}

/**
 * Atribui garagem pré-determinada a condômino com 1 veículo
 */
export async function assignPredeterminedGarage(userId: number, garageId: number): Promise<boolean> {
  const user = await db.getUserById(userId);
  const garage = await db.getGarageById(garageId);

  if (!user || !garage) return false;
  if (garage.type !== 'predetermined') return false;

  await db.updateGarage(garageId, { assignedUserId: userId });
  return true;
}

/**
 * Libera garagem (remove atribuição)
 */
export async function releaseGarage(garageId: number): Promise<boolean> {
  const garage = await db.getGarageById(garageId);
  if (!garage) return false;

  await db.updateGarage(garageId, { assignedUserId: null });
  return true;
}

/**
 * Função auxiliar para embaralhar array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
