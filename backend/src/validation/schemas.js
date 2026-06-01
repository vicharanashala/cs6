import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    username: z.string().trim().min(1, 'Username is required'),
    name: z.string().trim().min(2, 'Name must be between 2 and 50 characters').max(50),
    email: z.string().trim().email('Must be a valid email address'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit'),
    internshipStartDate: z.string()
      .optional()
      .nullable()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Internship start date must be a valid ISO8601 date string',
      })
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Must be a valid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

export const createQuestionSchema = z.object({
  body: z.object({
    title: z.string().trim().min(10, 'Title must be between 10 and 150 characters').max(150),
    body: z.string().trim().min(20, 'Body must be at least 20 characters long'),
    tags: z.array(z.string().trim().min(1, 'Tag value cannot be empty')).min(1).max(5, 'Tags must be between 1 and 5 strings'),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Category must be a valid Mongo ID')
  })
});

export const createAnswerSchema = z.object({
  body: z.object({
    body: z.string().trim().min(30, 'Answer body must be between 30 and 2000 characters').max(2000)
  })
});

export const createTicketSchema = z.object({
  body: z.object({
    title: z.string().trim().min(5, 'Title must be between 5 and 100 characters').max(100),
    description: z.string().trim().min(20, 'Description must be between 20 and 2000 characters').max(2000),
    category: z.enum(['technical', 'login', 'other']).optional()
  })
});
