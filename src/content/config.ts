import { defineCollection, z } from 'astro:content';

const tabsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1),
    artist: z.string().min(1),
    instrument: z.enum(['guitar', 'ukulele']).default('guitar'),
    tuning: z.string().default('Standard (E A D G B e)'),
    capo: z.number().int().min(0).max(12).default(0),
    bpm: z.number().int().min(30).max(300).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    strummingPattern: z.string().optional(),
    tags: z.array(z.string()).default([]),
    isFingerstyle: z.boolean().default(false),
    key: z.string().optional(),
    createdAt: z.string().or(z.date()).transform((val) => new Date(val).toISOString())
  })
});

export const collections = {
  tabs: tabsCollection
};
