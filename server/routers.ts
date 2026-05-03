import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

// Procedimentos com controle de acesso
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'sindico' && ctx.user.role !== 'subsindico') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores' });
  }
  return next({ ctx });
});

const sindicoOnlyProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'sindico') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a síndico' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ USERS ============
  users: router({
    list: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const user = await db.getUserById(input.id);
        if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
        
        // Usuários comuns só podem ver suas próprias informações
        if (ctx.user.role === 'user' && ctx.user.id !== input.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        return user;
      }),
    
    updateRole: sindicoOnlyProcedure
      .input(z.object({ userId: z.number(), role: z.enum(['user', 'subsindico', 'sindico']) }))
      .mutation(async ({ input }) => {
        return db.updateUserRole(input.userId, input.role);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Usuários comuns só podem editar suas próprias informações
        if (ctx.user.role === 'user' && ctx.user.id !== input.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        const { id, ...data } = input;
        const user = await db.getUserById(id);
        if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
        
        // Atualizar usuário (implementar em db.ts se necessário)
        return user;
      }),
  }),

  // ============ UNITS ============
  units: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Síndicos veem todas as unidades, usuários comuns veem apenas as suas
      if (ctx.user.role === 'user') {
        return db.getUnitsByUser(ctx.user.id);
      }
      return db.getAllUnits();
    }),
    
    create: adminProcedure
      .input(z.object({
        unitNumber: z.string(),
        block: z.string(),
        floor: z.number(),
        userId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createUnit(input);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const unit = await db.getUnitById(input.id);
        if (!unit) throw new TRPCError({ code: 'NOT_FOUND' });
        
        if (ctx.user.role === 'user' && unit.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        return unit;
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        unitNumber: z.string().optional(),
        block: z.string().optional(),
        floor: z.number().optional(),
        userId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateUnit(id, data);
      }),
  }),

  // ============ GARAGES ============
  garages: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getAllGarages();
    }),
    
    create: sindicoOnlyProcedure
      .input(z.object({
        garageNumber: z.string(),
        type: z.enum(['fixed', 'predetermined', 'sortable']),
        assignedUserId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createGarage(input);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const garage = await db.getGarageById(input.id);
        if (!garage) throw new TRPCError({ code: 'NOT_FOUND' });
        return garage;
      }),
    
    getAvailableSortable: protectedProcedure.query(async () => {
      return db.getAvailableSortableGarages();
    }),
    
    update: sindicoOnlyProcedure
      .input(z.object({
        id: z.number(),
        assignedUserId: z.number().optional().nullable(),
        type: z.enum(['fixed', 'predetermined', 'sortable']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateGarage(id, data);
      }),
  }),

  // ============ GARAGE DRAWS ============
  garageDraws: router({
    history: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getGarageDrawHistory(input.limit);
      }),
    
    getByUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input, ctx }) => {
        // Usuários comuns só podem ver seus próprios sorteios
        if (ctx.user.role === 'user' && ctx.user.id !== input.userId) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return db.getGarageDrawsByUser(input.userId);
      }),
    
    create: sindicoOnlyProcedure
      .input(z.object({
        drawDate: z.date(),
        garageId: z.number(),
        userId: z.number(),
        result: z.enum(['won', 'lost', 'skipped']),
      }))
      .mutation(async ({ input }) => {
        return db.createGarageDraw(input);
      }),
    
    performDraw: sindicoOnlyProcedure
      .mutation(async () => {
        const { performGarageDraw } = await import('./garageDrawService');
        return performGarageDraw();
      }),
    
    assignFixed: sindicoOnlyProcedure
      .input(z.object({ userId: z.number(), garageId: z.number() }))
      .mutation(async ({ input }) => {
        const { assignFixedGarage } = await import('./garageDrawService');
        const success = await assignFixedGarage(input.userId, input.garageId);
        if (!success) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nao foi possivel atribuir a garagem' });
        return { success: true };
      }),
    
    assignPredetermined: sindicoOnlyProcedure
      .input(z.object({ userId: z.number(), garageId: z.number() }))
      .mutation(async ({ input }) => {
        const { assignPredeterminedGarage } = await import('./garageDrawService');
        const success = await assignPredeterminedGarage(input.userId, input.garageId);
        if (!success) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nao foi possivel atribuir a garagem' });
        return { success: true };
      }),
    
    release: sindicoOnlyProcedure
      .input(z.object({ garageId: z.number() }))
      .mutation(async ({ input }) => {
        const { releaseGarage } = await import('./garageDrawService');
        const success = await releaseGarage(input.garageId);
        if (!success) throw new TRPCError({ code: 'NOT_FOUND' });
        return { success: true };
      }),
  }),

  // ============ KITCHEN UTENSILS ============
  kitchenUtensils: router({
    list: protectedProcedure.query(async () => {
      return db.getAllKitchenUtensils();
    }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        quantity: z.number().default(1),
        condition: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
      }))
      .mutation(async ({ input }) => {
        return db.createKitchenUtensil(input);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const utensil = await db.getKitchenUtensilById(input.id);
        if (!utensil) throw new TRPCError({ code: 'NOT_FOUND' });
        return utensil;
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        quantity: z.number().optional(),
        condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateKitchenUtensil(id, data);
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteKitchenUtensil(input.id);
      }),
  }),

  // ============ BALLROOM RESERVATIONS ============
  ballroomReservations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Usuários comuns veem apenas suas próprias reservas
      if (ctx.user.role === 'user') {
        return db.getBallroomReservationsByUser(ctx.user.id);
      }
      return db.getAllBallroomReservations();
    }),
    
    create: protectedProcedure
      .input(z.object({
        reservationDate: z.date(),
        startTime: z.string(),
        endTime: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createBallroomReservation({
          ...input,
          userId: ctx.user.id,
        });
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const reservation = await db.getBallroomReservationById(input.id);
        if (!reservation) throw new TRPCError({ code: 'NOT_FOUND' });
        
        // Usuários comuns só podem ver suas próprias reservas
        if (ctx.user.role === 'user' && reservation.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        return reservation;
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        reservationDate: z.date().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const reservation = await db.getBallroomReservationById(input.id);
        if (!reservation) throw new TRPCError({ code: 'NOT_FOUND' });
        
        // Usuários comuns só podem editar suas próprias reservas
        if (ctx.user.role === 'user' && reservation.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        const { id, ...data } = input;
        return db.updateBallroomReservation(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const reservation = await db.getBallroomReservationById(input.id);
        if (!reservation) throw new TRPCError({ code: 'NOT_FOUND' });
        
        // Apenas síndicos ou o próprio usuário podem deletar
        if (ctx.user.role === 'user' && reservation.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        return db.deleteBallroomReservation(input.id);
      }),
  }),

  // ============ CHAT ============
  chat: router({
    groups: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        const groups = await db.getAllChatGroups();
        // Filtrar grupos privados para usuários comuns
        if (ctx.user.role === 'user') {
          return groups.filter(g => g.isPublic);
        }
        return groups;
      }),
      
      create: sindicoOnlyProcedure
        .input(z.object({
          name: z.string(),
          description: z.string().optional(),
          isPublic: z.boolean().default(true),
        }))
        .mutation(async ({ input }) => {
          return db.createChatGroup(input);
        }),
      
      getById: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input, ctx }) => {
          const group = await db.getChatGroupById(input.id);
          if (!group) throw new TRPCError({ code: 'NOT_FOUND' });
          
          // Verificar se usuário tem acesso ao grupo
          if (!group.isPublic && ctx.user.role === 'user') {
            const isMember = await db.isMemberOfGroup(input.id, ctx.user.id);
            if (!isMember) throw new TRPCError({ code: 'FORBIDDEN' });
          }
          
          return group;
        }),
      
      update: sindicoOnlyProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          isPublic: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return db.updateChatGroup(id, data);
        }),
    }),
    
    messages: router({
      getByGroup: protectedProcedure
        .input(z.object({ groupId: z.number(), limit: z.number().optional() }))
        .query(async ({ input, ctx }) => {
          const group = await db.getChatGroupById(input.groupId);
          if (!group) throw new TRPCError({ code: 'NOT_FOUND' });
          
          // Verificar acesso
          if (!group.isPublic && ctx.user.role === 'user') {
            const isMember = await db.isMemberOfGroup(input.groupId, ctx.user.id);
            if (!isMember) throw new TRPCError({ code: 'FORBIDDEN' });
          }
          
          return db.getChatMessagesByGroup(input.groupId, input.limit);
        }),
      
      send: protectedProcedure
        .input(z.object({
          groupId: z.number(),
          message: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
          const group = await db.getChatGroupById(input.groupId);
          if (!group) throw new TRPCError({ code: 'NOT_FOUND' });
          
          // Verificar acesso
          if (!group.isPublic && ctx.user.role === 'user') {
            const isMember = await db.isMemberOfGroup(input.groupId, ctx.user.id);
            if (!isMember) throw new TRPCError({ code: 'FORBIDDEN' });
          }
          
          return db.createChatMessage({
            groupId: input.groupId,
            userId: ctx.user.id,
            message: input.message,
          });
        }),
      
      delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          // Apenas síndicos podem deletar mensagens
          if (ctx.user.role === 'user') {
            throw new TRPCError({ code: 'FORBIDDEN' });
          }
          return db.deleteChatMessage(input.id);
        }),
    }),
    
    members: router({
      getByGroup: protectedProcedure
        .input(z.object({ groupId: z.number() }))
        .query(async ({ input }) => {
          return db.getChatGroupMembers(input.groupId);
        }),
      
      add: sindicoOnlyProcedure
        .input(z.object({ groupId: z.number(), userId: z.number() }))
        .mutation(async ({ input }) => {
          return db.addChatGroupMember(input);
        }),
      
      remove: sindicoOnlyProcedure
        .input(z.object({ groupId: z.number(), userId: z.number() }))
        .mutation(async ({ input }) => {
          return db.removeChatGroupMember(input.groupId, input.userId);
        }),
    }),
  }),
  
  // ============ DOCUMENTS ============
  documents: router({
    generateBallroomReservation: protectedProcedure
      .input(z.object({ reservationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const reservation = await db.getBallroomReservationById(input.reservationId);
        if (!reservation) throw new TRPCError({ code: 'NOT_FOUND' });
        
        // Apenas sindico ou o responsavel pela reserva podem gerar
        if (ctx.user.role === 'user' && reservation.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        const { generateBallroomReservationDocument } = await import('./documentService');
        const pdfBuffer = await generateBallroomReservationDocument(input.reservationId);
        return { success: true, size: pdfBuffer.length };
      }),
    
    generateKitchenUtensils: sindicoOnlyProcedure
      .mutation(async () => {
        const { generateKitchenUtensilsReport } = await import('./documentService');
        const pdfBuffer = await generateKitchenUtensilsReport();
        return { success: true, size: pdfBuffer.length };
      }),
  }),
});

export type AppRouter = typeof appRouter;
