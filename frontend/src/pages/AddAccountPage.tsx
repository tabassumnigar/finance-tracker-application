import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getErrorMessage } from '../utils/errors';
import { useCreateAccount } from '../hooks/useAccounts';
import type { CreateAccountPayload } from '../types/account';
import './AddAccountPage.css';

const ACCOUNT_TYPES = [
  { value: 'BANK_ACCOUNT', label: 'Bank account' },
  { value: 'CREDIT_CARD', label: 'Credit card' },
  { value: 'CASH_WALLET', label: 'Cash wallet' },
  { value: 'SAVINGS_ACCOUNT', label: 'Savings account' },
] as const;

const accountFormSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  type: z.enum(['BANK_ACCOUNT', 'CREDIT_CARD', 'CASH_WALLET', 'SAVINGS_ACCOUNT']),
  currency: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(z.string().regex(/^[A-Z]{3}$/, 'Use ISO currency code like INR')),
  openingBalance: z.number().min(0, 'Opening balance cannot be negative'),
  institutionName: z.string().optional(),
});

type Feedback = {
  message: string;
  intent: 'success' | 'error';
};

export default function AddAccountPage() {
  const navigate = useNavigate();
  const createAccount = useCreateAccount();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountPayload>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: '',
      type: 'BANK_ACCOUNT',
      currency: 'INR',
      openingBalance: 0,
      institutionName: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createAccount.mutateAsync({
        ...values,
        currency: values.currency.toUpperCase(),
      });
      setFeedback({ message: 'Account created successfully', intent: 'success' });
      setTimeout(() => navigate('/accounts'), 700);
    } catch (apiError) {
      setFeedback({
        message: getErrorMessage(apiError, 'Unable to create account'),
        intent: 'error',
      });
    }
  });

  return (
    <section className="add-account-page">
      <div className="add-account-card">
        {feedback && (
          <p className={`feedback ${feedback.intent === 'error' ? 'error' : ''}`}>
            {feedback.message}
          </p>
        )}

        <form onSubmit={onSubmit} className="account-form">
          <label>
            Name
            <input type="text" {...register('name')} placeholder="Enter account name" />
            {errors.name && <span className="form-help">{errors.name.message}</span>}
          </label>

          <label>
            Account type
            <select {...register('type')}>
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Currency code
            <input type="text" {...register('currency')} placeholder="INR" maxLength={3} />
            {errors.currency && <span className="form-help">{errors.currency.message}</span>}
          </label>

          <label>
            Opening balance
            <input type="number" step="0.01" {...register('openingBalance', { valueAsNumber: true })} />
            {errors.openingBalance && <span className="form-help">{errors.openingBalance.message}</span>}
          </label>

          <label>
            Institution name
            <input type="text" {...register('institutionName')} placeholder="Optional" />
          </label>

          <div className="account-form-actions">
            <button type="button" className="ghost-btn" onClick={() => navigate('/accounts')}>
              Cancel
            </button>

            <button type="submit" className="primary-btn" disabled={isSubmitting || createAccount.isPending}>
              {isSubmitting || createAccount.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
