import * as z from 'zod';
export const userSchema = z.object({
    id: z.number(),
    name: z.string(),
});
