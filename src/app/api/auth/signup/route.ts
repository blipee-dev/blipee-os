import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/service'
import { z } from 'zod'

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  companyName: z.string().optional(),
  role: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = signUpSchema.parse(body)
    
    // Sign up user
    const result = await authService.signUp(
      validated.email,
      validated.password,
      {
        full_name: validated.fullName,
        company_name: validated.companyName,
        role: validated.role
      }
    )
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sign up'
      },
      { status: 500 }
    )
  }
}