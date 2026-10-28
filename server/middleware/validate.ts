import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'

/**
 * 3.4 Input Validation Middleware (Zod)
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Data payload tidak valid',
        details: parsed.error.flatten().fieldErrors,
      })
      return
    }
    req.body = parsed.data
    next()
  }
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Parameter query tidak valid',
        details: parsed.error.flatten().fieldErrors,
      })
      return
    }
    ;(req as Request & { validatedQuery: T }).validatedQuery = parsed.data
    next()
  }
}
