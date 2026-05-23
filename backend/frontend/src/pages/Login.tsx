import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'
import { getApiError } from '../utils/helpers'
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { motion } from 'framer-motion'
import AuthLayout from '../components/layout/AuthLayout'
import InputField from '../components/ui/InputField'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const { user, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (user) return <Navigate to="/dashboard" replace />

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await authApi.login(data)
      setUser(res.data.user)
      toast.success('Welcome back!')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your secure document vault"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputField
          label="Email address"
          icon={Mail}
          placeholder="you@company.com"
          autoComplete="email"
          registration={register('email')}
          error={errors.email?.message}
        />
        <InputField
          label="Password"
          icon={Lock}
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          registration={register('password')}
          error={errors.password?.message}
        />

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
              Sign in
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>
    </AuthLayout>
  )
}
