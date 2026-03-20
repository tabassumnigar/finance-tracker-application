import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import Modal from '../components/common/Modal';
import { getErrorMessage } from '../utils/errors';
import {
  useArchiveCategory,
  useCategoriesQuery,
  useCreateCategory,
  useUpdateCategory,
} from '../hooks/useCategories';
import type { CategoryDto, CreateCategoryPayload, UpdateCategoryPayload } from '../types/category';

import './CategoriesPage.css';

const categoryFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z
    .string()
    .regex(/^#?[0-9A-Fa-f]{6}$/, 'Provide a valid hex color (with or without #)')
    .optional(),
  icon: z.string().max(32, 'Icon id must be under 32 characters').optional(),
});

type Feedback = {
  message: string;
  intent: 'success' | 'error';
};

type CategoryType = 'INCOME' | 'EXPENSE';

const accentByType: Record<CategoryType, string> = {
  INCOME: '#22c55e',
  EXPENSE: '#f97316',
};

const defaultExpenseCategories = [
  'Food',
  'Rent',
  'Utilities',
  'Transport',
  'Entertainment',
  'Shopping',
  'Health',
  'Education',
  'Travel',
  'Subscriptions',
  'Miscellaneous',
];

const defaultIncomeCategories = [
  'Salary',
  'Freelance',
  'Bonus',
  'Investment',
  'Gift',
  'Refund',
  'Other',
];

const defaultColorByType: Record<CategoryType, string> = {
  INCOME: '#22C55E',
  EXPENSE: '#F97316',
};

function normalizeHex(value?: string | null) {
  if (!value) return '';
  return value.startsWith('#') ? value : `#${value}`;
}

function getInitials(value?: string | null) {
  if (!value?.trim()) return '•';
  return value.trim().slice(0, 2).toUpperCase();
}

function getArchivedValue(category: CategoryDto & { isArchived?: boolean }) {
  return category.archived ?? category.isArchived ?? false;
}

function getNormalizedType(value?: string): CategoryType {
  return String(value).toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE';
}

export default function CategoriesPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<(CategoryDto & { isArchived?: boolean }) | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [activeType, setActiveType] = useState<CategoryType>('EXPENSE');

  const categoriesQuery = useCategoriesQuery(showArchived);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const archiveCategory = useArchiveCategory();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState,
  } = useForm<CreateCategoryPayload>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      type: 'EXPENSE',
      color: '#F97316',
      icon: '',
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEdit,
    reset: resetEdit,
    watch: watchEdit,
    setValue: setEditValue,
    formState: { errors: editErrors, isSubmitting: isEditSubmitting },
  } = useForm<UpdateCategoryPayload>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      type: 'EXPENSE',
      color: '#F97316',
      icon: '',
    },
  });

  const rawData = categoriesQuery.data as unknown;

  const categories = useMemo(() => {
    if (Array.isArray(rawData)) return rawData as (CategoryDto & { isArchived?: boolean })[];
    if (rawData && typeof rawData === 'object') {
      const maybeData = (rawData as { data?: unknown }).data;
      const maybeContent = (rawData as { content?: unknown }).content;

      if (Array.isArray(maybeData)) return maybeData as (CategoryDto & { isArchived?: boolean })[];
      if (Array.isArray(maybeContent)) return maybeContent as (CategoryDto & { isArchived?: boolean })[];
    }

    return [];
  }, [rawData]);

  const grouped = useMemo(() => {
    const base = {
      INCOME: [] as (CategoryDto & { isArchived?: boolean })[],
      EXPENSE: [] as (CategoryDto & { isArchived?: boolean })[],
    };

    categories.forEach((category) => {
      const normalizedType = getNormalizedType(category.type);
      base[normalizedType].push({
        ...category,
        type: normalizedType,
      });
    });

    base.INCOME.sort((a, b) => a.name.localeCompare(b.name));
    base.EXPENSE.sort((a, b) => a.name.localeCompare(b.name));

    return base;
  }, [categories]);

  const existingNames = useMemo(() => {
    const set = new Set(
      categories.map((item) => `${getNormalizedType(item.type)}:${item.name.trim().toLowerCase()}`)
    );
    return set;
  }, [categories]);

  const suggestedDefaults = useMemo(() => {
    return {
      EXPENSE: defaultExpenseCategories.filter(
        (name) => !existingNames.has(`EXPENSE:${name.toLowerCase()}`)
      ),
      INCOME: defaultIncomeCategories.filter(
        (name) => !existingNames.has(`INCOME:${name.toLowerCase()}`)
      ),
    };
  }, [existingNames]);

  const createColor = normalizeHex(watch('color')) || '#CBD5E1';
  const createIcon = watch('icon');
  const createName = watch('name');
  const createType = watch('type') ?? 'EXPENSE';

  const editColor = normalizeHex(watchEdit('color')) || '#CBD5E1';
  const editIcon = watchEdit('icon');
  const editName = watchEdit('name');
  const editType = watchEdit('type') ?? 'EXPENSE';

  useEffect(() => {
    if (!isCreateOpen) {
      reset({
        name: '',
        type: activeType,
        color: defaultColorByType[activeType],
        icon: '',
      });
    }
  }, [isCreateOpen, reset, activeType]);

  useEffect(() => {
    if (!isEditOpen) {
      setEditingCategory(null);
      resetEdit();
    }
  }, [isEditOpen, resetEdit]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!editingCategory) return;

    resetEdit({
      name: editingCategory.name,
      type: getNormalizedType(editingCategory.type),
      color: normalizeHex(editingCategory.color) || defaultColorByType[getNormalizedType(editingCategory.type)],
      icon: editingCategory.icon ?? '',
    });
  }, [editingCategory, resetEdit]);

  const handleCreate = handleSubmit(async (values) => {
    try {
      const normalizedType = getNormalizedType(values.type);
      const payload: CreateCategoryPayload = {
        ...values,
        type: normalizedType,
        color: normalizeHex(values.color) || defaultColorByType[normalizedType],
        icon: values.icon?.trim() || '',
      };

      await createCategory.mutateAsync(payload);
      setFeedback({ message: 'New category added', intent: 'success' });
      setCreateOpen(false);
    } catch (apiError) {
      setFeedback({
        message: getErrorMessage(apiError, 'Unable to create category'),
        intent: 'error',
      });
    }
  });

  const handleUpdate = handleEdit(async (values) => {
    if (!editingCategory) return;

    try {
      const normalizedType = getNormalizedType(values.type);
      const payload: UpdateCategoryPayload = {
        ...values,
        type: normalizedType,
        color: normalizeHex(values.color) || defaultColorByType[normalizedType],
        icon: values.icon?.trim() || '',
      };

      await updateCategory.mutateAsync({
        id: editingCategory.id,
        payload,
      });

      setFeedback({ message: 'Category updated', intent: 'success' });
      setEditOpen(false);
    } catch (apiError) {
      setFeedback({
        message: getErrorMessage(apiError, 'Unable to update category'),
        intent: 'error',
      });
    }
  });

  const handleArchive = async (category: CategoryDto) => {
    const confirmed = window.confirm(`Archive "${category.name}"?`);
    if (!confirmed) return;

    try {
      await archiveCategory.mutateAsync(category.id);
      setFeedback({ message: `${category.name} archived`, intent: 'success' });
    } catch (apiError) {
      setFeedback({
        message: getErrorMessage(apiError, 'Unable to archive category'),
        intent: 'error',
      });
    }
  };

  const handleQuickAddDefault = async (name: string, type: CategoryType) => {
    try {
      await createCategory.mutateAsync({
        name,
        type,
        color: defaultColorByType[type],
        icon: '',
      });
      setFeedback({ message: `${name} added`, intent: 'success' });
    } catch (apiError) {
      setFeedback({
        message: getErrorMessage(apiError, 'Unable to add default category'),
        intent: 'error',
      });
    }
  };

  const isLoading = categoriesQuery.isLoading;
  const isError = categoriesQuery.isError;
  const error = categoriesQuery.error;

  if (isLoading) {
    return (
      <section className="categories-page">
        <div className="categories-shell">
          <div className="categories-loading">Loading categories…</div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="categories-page">
        <div className="categories-shell">
          <div className="categories-error">
            {getErrorMessage(error, 'Unable to load categories')}
          </div>
        </div>
      </section>
    );
  }

  const hasCategories = categories.length > 0;

  return (
    <section className="categories-page">
      <div className="categories-shell">
        <header className="categories-hero">
          <div>
            <p className="categories-eyebrow">6.4 Categories Module</p>
            <h1>Manage categories</h1>
            <p className="categories-subtitle">
              Add custom categories, edit color and icon, archive categories,
              and keep income and expense categories separate.
            </p>
          </div>

          <div className="categories-header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowArchived((prev) => !prev)}
            >
              {showArchived ? 'Hide archived' : 'Show archived'}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                reset({
                  name: '',
                  type: activeType,
                  color: defaultColorByType[activeType],
                  icon: '',
                });
                setCreateOpen(true);
              }}
            >
              + New Category
            </button>
          </div>
        </header>

        {feedback && (
          <div className={`feedback-banner ${feedback.intent === 'error' ? 'is-error' : 'is-success'}`}>
            {feedback.message}
          </div>
        )}

        <div className="categories-stats">
          <div className="stat-card">
            <span className="stat-label">Income Categories</span>
            <strong>{grouped.INCOME.length}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Expense Categories</span>
            <strong>{grouped.EXPENSE.length}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Archived Visible</span>
            <strong>{showArchived ? 'Yes' : 'No'}</strong>
          </div>
        </div>

        <section className="page-card">
          <div className="section-head">
            <div>
              <h2>Default categories</h2>
              <p>Add missing default income and expense categories in one click.</p>
            </div>
          </div>

          <div className="default-groups">
            <div className="default-group">
              <div className="default-group-title">
                <span className="type-dot" style={{ backgroundColor: accentByType.EXPENSE }} />
                Expense
              </div>

              <div className="default-chip-list">
                {suggestedDefaults.EXPENSE.length === 0 ? (
                  <p className="muted-text">All default expense categories already added.</p>
                ) : (
                  suggestedDefaults.EXPENSE.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="default-chip"
                      onClick={() => handleQuickAddDefault(item, 'EXPENSE')}
                      disabled={createCategory.isPending}
                    >
                      + {item}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="default-group">
              <div className="default-group-title">
                <span className="type-dot" style={{ backgroundColor: accentByType.INCOME }} />
                Income
              </div>

              <div className="default-chip-list">
                {suggestedDefaults.INCOME.length === 0 ? (
                  <p className="muted-text">All default income categories already added.</p>
                ) : (
                  suggestedDefaults.INCOME.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="default-chip"
                      onClick={() => handleQuickAddDefault(item, 'INCOME')}
                      disabled={createCategory.isPending}
                    >
                      + {item}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="page-card">
          <div className="section-head">
            <div>
              <h2>Your categories</h2>
              <p>Separate lists for income and expense categories.</p>
            </div>

            <div className="type-switch">
              <button
                type="button"
                className={activeType === 'EXPENSE' ? 'active' : ''}
                onClick={() => setActiveType('EXPENSE')}
              >
                Expense
              </button>
              <button
                type="button"
                className={activeType === 'INCOME' ? 'active' : ''}
                onClick={() => setActiveType('INCOME')}
              >
                Income
              </button>
            </div>
          </div>

          {!hasCategories ? (
            <div className="empty-state">
              <p>No categories yet.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setCreateOpen(true)}
              >
                Create category
              </button>
            </div>
          ) : (
            <div className="category-sections">
              {(['EXPENSE', 'INCOME'] as const).map((type) => (
                <div key={type} className="category-section">
                  <div className="category-section-head">
                    <div className="category-section-title">
                      <span className="type-dot" style={{ backgroundColor: accentByType[type] }} />
                      <h3>{type === 'EXPENSE' ? 'Expense categories' : 'Income categories'}</h3>
                    </div>

                    <span
                      className="category-count"
                      style={{ borderColor: accentByType[type], color: accentByType[type] }}
                    >
                      {grouped[type].length}
                    </span>
                  </div>

                  {grouped[type].length === 0 ? (
                    <p className="muted-text">
                      No {type === 'EXPENSE' ? 'expense' : 'income'} categories yet.
                    </p>
                  ) : (
                    <div className="category-grid">
                      {grouped[type].map((category) => {
                        const isArchived = getArchivedValue(category);

                        return (
                          <article
                            key={category.id}
                            className={`category-card ${isArchived ? 'archived' : ''}`}
                          >
                            <div className="category-card-main">
                              <div
                                className="category-avatar"
                                style={{
                                  backgroundColor: normalizeHex(category.color) || '#E2E8F0',
                                }}
                              >
                                {category.icon?.trim()
                                  ? category.icon.trim().slice(0, 2).toUpperCase()
                                  : getInitials(category.name)}
                              </div>

                              <div className="category-info">
                                <div className="category-title-row">
                                  <strong>{category.name}</strong>
                                  {isArchived && <span className="archived-badge">Archived</span>}
                                </div>

                                <div className="category-meta">
                                  <span>{getNormalizedType(category.type)}</span>
                                  <span>•</span>
                                  <span>{normalizeHex(category.color) || 'No color'}</span>
                                  {category.icon && (
                                    <>
                                      <span>•</span>
                                      <span>Icon: {category.icon}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="category-actions">
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setEditingCategory(category);
                                  setEditOpen(true);
                                }}
                              >
                                Edit
                              </button>

                              {!isArchived && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleArchive(category)}
                                >
                                  Archive
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal open={isCreateOpen} title="Create category" onClose={() => setCreateOpen(false)}>
        <form onSubmit={handleCreate} className="category-form">
          <div className="preview-card">
            <div className="preview-avatar" style={{ backgroundColor: createColor }}>
              {createIcon?.trim()
                ? createIcon.trim().slice(0, 2).toUpperCase()
                : getInitials(createName)}
            </div>
            <div>
              <strong>{createName || 'Category preview'}</strong>
              <p>{createType === 'INCOME' ? 'Income category' : 'Expense category'}</p>
            </div>
          </div>

          <label className="field">
            <span>Name</span>
            <input type="text" {...register('name')} placeholder="e.g. Food" />
            {formState.errors.name && <small>{formState.errors.name.message}</small>}
          </label>

          <label className="field">
            <span>Type</span>
            <select
              {...register('type')}
              onChange={(e) => {
                const nextType = getNormalizedType(e.target.value);
                setValue('type', nextType);
                setValue('color', defaultColorByType[nextType]);
              }}
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </label>

          <div className="field-grid">
            <label className="field">
              <span>Color</span>
              <div className="color-input-wrap">
                <span className="color-swatch" style={{ backgroundColor: createColor }} />
                <input type="text" {...register('color')} placeholder="#F97316" />
              </div>
              {formState.errors.color && <small>{formState.errors.color.message}</small>}
            </label>

            <label className="field">
              <span>Icon (optional)</span>
              <input type="text" {...register('icon')} placeholder="e.g. FD, cart, salary" />
              {formState.errors.icon && <small>{formState.errors.icon.message}</small>}
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting ? 'Saving…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={isEditOpen} title="Edit category" onClose={() => setEditOpen(false)}>
        <form onSubmit={handleUpdate} className="category-form">
          <div className="preview-card">
            <div className="preview-avatar" style={{ backgroundColor: editColor }}>
              {editIcon?.trim()
                ? editIcon.trim().slice(0, 2).toUpperCase()
                : getInitials(editName)}
            </div>
            <div>
              <strong>{editName || 'Category preview'}</strong>
              <p>{editType === 'INCOME' ? 'Income category' : 'Expense category'}</p>
            </div>
          </div>

          <label className="field">
            <span>Name</span>
            <input type="text" {...registerEdit('name')} placeholder="Category name" />
            {editErrors.name && <small>{editErrors.name.message}</small>}
          </label>

          <label className="field">
            <span>Type</span>
            <select
              {...registerEdit('type')}
              onChange={(e) => {
                const nextType = getNormalizedType(e.target.value);
                setEditValue('type', nextType);
              }}
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </label>

          <div className="field-grid">
            <label className="field">
              <span>Color</span>
              <div className="color-input-wrap">
                <span className="color-swatch" style={{ backgroundColor: editColor }} />
                <input type="text" {...registerEdit('color')} placeholder="#F97316" />
              </div>
              {editErrors.color && <small>{editErrors.color.message}</small>}
            </label>

            <label className="field">
              <span>Icon (optional)</span>
              <input type="text" {...registerEdit('icon')} placeholder="e.g. FD, cart, salary" />
              {editErrors.icon && <small>{editErrors.icon.message}</small>}
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isEditSubmitting}
            >
              {isEditSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}