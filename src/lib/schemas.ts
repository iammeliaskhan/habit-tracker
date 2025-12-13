import { z } from "zod";

export const colorHexSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .optional();

export const createHabitSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: colorHexSchema,
});

export const updateHabitSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    color: colorHexSchema,
    archived: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "Provide at least one field to update.",
  });

export const toggleCheckInSchema = z.object({
  date: z.string(), // validated/parsed separately as YYYY-MM-DD
  completed: z.boolean().optional(), // default: toggle
});
