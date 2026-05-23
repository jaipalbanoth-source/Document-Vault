import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { getApiError } from '../utils/helpers'
import { Mail, Lock, User as UserIcon, Loader2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { motion } from 'framer-motion'
import AuthLayout from '../components/layout/AuthLayout'
import InputField from '../components/ui/InputField'

const schema = z.object({
  full_name: z.string().min(2, 'Name is too short').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      })
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start managing documents with OCR extraction"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          label="Full name"
          icon={UserIcon}
          placeholder="Jane Doe"
          registration={register('full_name')}
          error={errors.full_name?.message}
        />
        <InputField
          label="Email address"
          icon={Mail}
          placeholder="you@company.com"
          registration={register('email')}
          error={errors.email?.message}
        />
        <InputField
          label="Password"
          icon={Lock}
          type="password"
          placeholder="Min. 8 chars, 1 uppercase, 1 number"
          registration={register('password')}
          error={errors.password?.message}
        />
        <InputField
          label="Confirm password"
          icon={Lock}
          type="password"
          placeholder="••••••••"
          registration={register('confirm_password')}
          error={errors.confirm_password?.message}
        />

        <p className="text-xs text-slate-500 leading-relaxed">
          Password must be 8+ characters with at least one uppercase letter and one number.
        </p>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 mt-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Create account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>
    </AuthLayout>
  )
}
