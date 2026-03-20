import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '../services/auth';
import { getErrorMessage } from '../utils/errors';
import './ForgotPasswordPage.css';

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotForm) => {
    setStatus('');
    setResetToken('');
    try {
      const response = await authService.forgotPassword(values);
      setStatus(response.message);
      setResetToken(response.resetToken ?? '');
    } catch (error) {
      setStatus(getErrorMessage(error, 'Unable to start password reset.'));
    }
  };

  return (
    <section className="auth-panel">
      <div className="auth-card">
        <header className="auth-card-head">
          <h2>Forgot password</h2>
          <p>Provide the email tied to your account and we will send a magic reset link.</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
          <div className="form-grid">
            <label>
              Email
              <input type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <span className="form-help">{errors.email.message}</span>}
            </label>
          </div>
          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
          {status && <div className="auth-support-status">{status}</div>}
          {resetToken && (
            <div className="auth-support-status">
              Development reset token: <code>{resetToken}</code>
            </div>
          )}
        </form>

        <div className="auth-support-links">
          <Link to="/login">Back to sign in</Link>
          <Link to="/reset-password">Already have a token?</Link>
        </div>
      </div>
    </section>
  );
}
