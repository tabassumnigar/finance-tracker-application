import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '../services/auth';
import { useAuthStore } from '../store/authStore';
import { getErrorMessage } from '../utils/errors';
import './ResetPasswordPage.css';

const resetSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, 'Password must include upper, lower, and numeric chars'),
    confirmPassword: z.string().min(8),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<string>('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { token: searchParams.get('token') ?? '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: ResetForm) => {
    setStatus('');
    try {
      await authService.resetPassword({ token: values.token, password: values.password });
      clearAuth();
      setStatus('Password updated successfully. Please sign in with your new password.');
      navigate('/login');
    } catch (error) {
      setStatus(getErrorMessage(error, 'Unable to reset password. Check the token.'));
    }
  };

  return (
    <section className="auth-panel">
      <div className="auth-card">
        <header className="auth-card-head">
          <h2>Reset password</h2>
          <p>Create a new password for your account. The reset token is pre-filled if you opened the email link.</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
          <div className="form-grid">
            <label>
              Reset token
              <input type="text" {...register('token')} readOnly={Boolean(searchParams.get('token'))} />
              {errors.token && <span className="form-help">{errors.token.message}</span>}
            </label>
            <label>
              New password
              <input type="password" {...register('password')} />
              {errors.password && <span className="form-help">{errors.password.message}</span>}
            </label>
            <label>
              Confirm password
              <input type="password" {...register('confirmPassword')} />
              {errors.confirmPassword && (
                <span className="form-help">{errors.confirmPassword.message}</span>
              )}
            </label>
          </div>
          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting...' : 'Reset password'}
          </button>
          {status && <div className="auth-support-status">{status}</div>}
        </form>

        <div className="auth-support-links">
          <Link to="/login">Back to sign in</Link>
          <Link to="/forgot-password">Request a new reset link</Link>
        </div>
      </div>
    </section>
  );
}
