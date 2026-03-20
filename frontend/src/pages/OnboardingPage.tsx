import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { accountsApi } from '../services/accounts';
import { budgetsApi } from '../services/budgets';
import { categoriesApi } from '../services/categories';
import { useOnboardingStore } from '../store/onboardingStore';
import { getErrorMessage } from '../utils/errors';
import type { CategoryDto } from '../types/category';

const accountSchema = z.object({
  name: z.string().min(2, 'Account name is required'),
  type: z.enum(['BANK_ACCOUNT', 'CREDIT_CARD', 'CASH_WALLET', 'SAVINGS_ACCOUNT']),
  currency: z.string().length(3, 'Currency code must be 3 characters'),
  openingBalance: z.number().nonnegative('Opening balance cannot be negative'),
  institutionName: z.string().optional(),
});

const budgetSchema = z.object({
  categoryId: z.number().positive('Pick a category'),
  amount: z.number().positive('Amount must be greater than zero'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(new Date().getFullYear()),
});

const currencyOptions = ['INR', 'USD', 'EUR'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { completed, markComplete } = useOnboardingStore();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [accountStatus, setAccountStatus] = useState<string>('');
  const [budgetStatus, setBudgetStatus] = useState<string>('');

  const {
    register: registerAccount,
    handleSubmit: handleSubmitAccount,
    formState: { errors: accountErrors, isSubmitting: isSavingAccount },
    reset: resetAccount,
  } = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'BANK_ACCOUNT',
      currency: 'INR',
      openingBalance: 0,
      institutionName: '',
    },
  });

  const {
    register: registerBudget,
    handleSubmit: handleSubmitBudget,
    formState: { errors: budgetErrors, isSubmitting: isSavingBudget },
    reset: resetBudget,
  } = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: 0,
      amount: 1000,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  });

  const hasCategories = categories.length > 0;

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (completed) {
      navigate('/dashboard');
    }
  }, [completed, navigate]);

  const handleAccountSubmit = async (values: z.infer<typeof accountSchema>) => {
    setAccountStatus('');
    try {
      await accountsApi.create(values);
      setAccountStatus('Great! Your first account is ready.');
      resetAccount();
    } catch (error) {
      setAccountStatus(getErrorMessage(error, 'Unable to create account.'));
    }
  };

  const handleBudgetSubmit = async (values: z.infer<typeof budgetSchema>) => {
    setBudgetStatus('');
    try {
      await budgetsApi.create(values);
      setBudgetStatus('Budget saved! Redirecting to your dashboard.');
      resetBudget();
      markComplete();
      navigate('/dashboard');
    } catch (error) {
      setBudgetStatus(getErrorMessage(error, 'Unable to create budget.'));
    }
  };

  const skipOnboarding = () => {
    markComplete();
    navigate('/dashboard');
  };

  const recommendedCategory = useMemo(() => categories.find((category) => category.type === 'EXPENSE'), [categories]);

  return (
    <section className="onboarding-panel">
      <div>
        <h2>Welcome aboard!</h2>
        <p>
          Let’s set up your first account and optionally your first monthly budget. You can skip any step and finish
          setup later from the dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmitAccount(handleAccountSubmit)} className="form-stack">
        <h3>Create your first account</h3>
        <label>
          Account name
          <input type="text" {...registerAccount('name')} />
          {accountErrors.name && <span className="form-help">{accountErrors.name.message}</span>}
        </label>

        <label>
          Account type
          <select {...registerAccount('type')}>
            <option value="BANK_ACCOUNT">Bank account</option>
            <option value="CREDIT_CARD">Credit card</option>
            <option value="CASH_WALLET">Cash wallet</option>
            <option value="SAVINGS_ACCOUNT">Savings account</option>
          </select>
        </label>

        <label>
          Currency
          <select {...registerAccount('currency')}>
            {currencyOptions.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>

        <label>
          Opening balance
          <input type="number" step="0.01" {...registerAccount('openingBalance', { valueAsNumber: true })} />
          {accountErrors.openingBalance && (
            <span className="form-help">{accountErrors.openingBalance.message}</span>
          )}
        </label>

        <label>
          Institution (optional)
          <input type="text" {...registerAccount('institutionName')} />
        </label>

        <button type="submit" disabled={isSavingAccount}>
          {isSavingAccount ? 'Saving account…' : 'Save account'}
        </button>
        {accountStatus && (
          <p className="form-help" role="status">
            {accountStatus}
          </p>
        )}
      </form>

      <form onSubmit={handleSubmitBudget(handleBudgetSubmit)} className="form-stack">
        <h3>Optional: Set your first budget</h3>
        <p>{hasCategories ? 'Choose a category and target amount.' : 'Loading categories…'}</p>

        <label>
          Category
          <select {...registerBudget('categoryId')}>
            <option value={0}>Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.type})
              </option>
            ))}
          </select>
          {budgetErrors.categoryId && <span className="form-help">{budgetErrors.categoryId.message}</span>}
        </label>

        <label>
          Amount
          <input type="number" step="0.01" {...registerBudget('amount', { valueAsNumber: true })} />
          {budgetErrors.amount && <span className="form-help">{budgetErrors.amount.message}</span>}
        </label>

        <label>
          Month
          <input type="number" {...registerBudget('month', { valueAsNumber: true })} />
        </label>

        <label>
          Year
          <input type="number" {...registerBudget('year', { valueAsNumber: true })} />
        </label>

        <button type="submit" disabled={isSavingBudget || !hasCategories}>
          {hasCategories ? (isSavingBudget ? 'Saving budget…' : 'Save budget and finish') : 'Loading categories…'}
        </button>
        {budgetStatus && (
          <p className="form-help" role="status">
            {budgetStatus}
          </p>
        )}
      </form>

      {recommendedCategory && (
        <p className="form-help">Recommended starter category: {recommendedCategory.name}</p>
      )}

      <button type="button" className="secondary" onClick={skipOnboarding}>
        Skip onboarding and go to dashboard
      </button>
    </section>
  );
}
