import { z } from "zod";

export const masteryEnum = z.enum(["NOT_SEEN", "SEEN", "KNOWN", "MASTERED"]);

export const progressUpsertSchema = z.object({
  techniqueId: z.string().min(1),
  mastery: masteryEnum,
  notes: z.string().max(2000).optional()
});

export const importSchema = z.object({
  belts: z.array(z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    orderIndex: z.number().int().nonnegative(),
    isActive: z.boolean().optional(),
    modules: z.array(z.object({
      title: z.string().min(1),
      orderIndex: z.number().int().nonnegative(),
      isActive: z.boolean().optional(),
      techniques: z.array(z.object({
        title: z.string().min(1),
        orderIndex: z.number().int().nonnegative(),
        descriptionRich: z.string().optional(),
        keywords: z.string().optional(),
        isActive: z.boolean().optional()
      }))
    }))
  }))
});


export const authRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200)
});

export const authLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200)
});
