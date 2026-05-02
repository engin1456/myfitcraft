import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'errors.required').email('errors.invalidEmail'),
  password: z.string().min(6, 'errors.passwordTooShort'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, 'errors.required'),
    email: z.string().min(1, 'errors.required').email('errors.invalidEmail'),
    password: z.string().min(6, 'errors.passwordTooShort'),
    passwordConfirm: z.string().min(6, 'errors.passwordTooShort'),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'errors.passwordsDontMatch',
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'errors.required').email('errors.invalidEmail'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const profileSetupSchema = z.object({
  goal: z.enum(['bulk', 'cut', 'maintain', 'strength']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  height: z
    .number({ message: 'errors.required' })
    .min(100, 'errors.invalidHeight')
    .max(250, 'errors.invalidHeight'),
  weight: z
    .number({ message: 'errors.required' })
    .min(30, 'errors.invalidWeight')
    .max(300, 'errors.invalidWeight'),
});

export type ProfileSetupValues = z.infer<typeof profileSetupSchema>;
