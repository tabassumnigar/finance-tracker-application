package com.finance.tracker.service;

import com.finance.tracker.dto.budget.BudgetDto;
import com.finance.tracker.dto.budget.BudgetRequest;
import com.finance.tracker.entity.Budget;
import com.finance.tracker.entity.Category;
import com.finance.tracker.entity.CategoryType;
import com.finance.tracker.entity.Transaction;
import com.finance.tracker.entity.User;
import com.finance.tracker.exception.BadRequestException;
import com.finance.tracker.exception.ConflictException;
import com.finance.tracker.exception.ResourceNotFoundException;
import com.finance.tracker.mapper.BudgetMapper;
import com.finance.tracker.repository.BudgetRepository;
import com.finance.tracker.repository.CategoryRepository;
import com.finance.tracker.repository.TransactionRepository;
import com.finance.tracker.repository.UserRepository;
import com.finance.tracker.security.CurrentUserProvider;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BudgetService {
    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(Transactional.TxType.SUPPORTS)
    public List<BudgetDto> listBudgets(int month, int year) {
        User user = currentUser();
        validateMonthYear(month, year);
        List<Budget> budgets = budgetRepository.findByUserAndMonthAndYear(user, month, year);
        budgets.sort(Comparator.comparing(b -> b.getCategory().getName()));
        return budgets.stream()
            .map(budget -> buildBudgetResponse(budget, user))
            .toList();
    }

    @Transactional
    public BudgetDto createBudget(BudgetRequest request) {
        User user = currentUser();
        Category category = resolveCategory(request.categoryId(), user);
        validateMonthYear(request.month(), request.year());
        ensureNoDuplicate(user, category, request.month(), request.year(), null);
        Budget budget = new Budget();
        budget.setUser(user);
        budget.setCategory(category);
        budget.setMonth(request.month());
        budget.setYear(request.year());
        budget.setLimitAmount(request.amount());
        budget.setAlertThresholdPercent(thresholdValue(request.alertThresholdPercent()));
        Budget saved = budgetRepository.save(budget);
        return buildBudgetResponse(saved, user);
    }

    @Transactional
    public BudgetDto updateBudget(Long id, BudgetRequest request) {
        User user = currentUser();
        Budget budget = budgetRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new ResourceNotFoundException("Budget not found"));
        Category category = resolveCategory(request.categoryId(), user);
        validateMonthYear(request.month(), request.year());
        ensureNoDuplicate(user, category, request.month(), request.year(), budget.getId());
        budget.setCategory(category);
        budget.setMonth(request.month());
        budget.setYear(request.year());
        budget.setLimitAmount(request.amount());
        budget.setAlertThresholdPercent(thresholdValue(request.alertThresholdPercent()));
        Budget updated = budgetRepository.save(budget);
        return buildBudgetResponse(updated, user);
    }

    @Transactional
    public void deleteBudget(Long id) {
        User user = currentUser();
        Budget budget = budgetRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new ResourceNotFoundException("Budget not found"));
        budgetRepository.delete(budget);
    }

    @Transactional
    public List<BudgetDto> duplicateLastMonth(int month, int year) {
        User user = currentUser();
        validateMonthYear(month, year);
        int prevMonth = month == 1 ? 12 : month - 1;
        int prevYear = month == 1 ? year - 1 : year;
        List<Budget> previous = budgetRepository.findByUserAndMonthAndYear(user, prevMonth, prevYear);
        List<Budget> created = new ArrayList<>();
        for (Budget budget : previous) {
            boolean exists = budgetRepository.findByUserAndCategoryAndMonthAndYear(user, budget.getCategory(), month, year)
                .isPresent();
            if (exists) {
                continue;
            }
            Budget clone = new Budget();
            clone.setUser(user);
            clone.setCategory(budget.getCategory());
            clone.setMonth(month);
            clone.setYear(year);
            clone.setLimitAmount(budget.getLimitAmount());
            clone.setAlertThresholdPercent(budget.getAlertThresholdPercent());
            created.add(budgetRepository.save(clone));
        }
        return created.stream()
            .map(budget -> buildBudgetResponse(budget, user))
            .toList();
    }

    private BudgetDto buildBudgetResponse(Budget budget, User user) {
        OffsetDateTime start = startOfMonth(budget.getYear(), budget.getMonth());
        OffsetDateTime end = endOfMonth(budget.getYear(), budget.getMonth());
        BigDecimal spent = safeSum(transactionRepository.sumByCategoryAndPeriod(
            user,
            budget.getCategory().getId(),
            Transaction.TransactionType.EXPENSE,
            start,
            end
        ));
        double progress = budget.getLimitAmount().compareTo(BigDecimal.ZERO) == 0
            ? 0
            : spent.divide(budget.getLimitAmount(), 4, RoundingMode.HALF_UP).doubleValue();
        double progressPercent = Math.round(progress * 10000.0) / 100.0;
        String alertLevel = determineAlertLevel(progressPercent, budget.getAlertThresholdPercent());
        return BudgetMapper.toDto(budget, spent, progressPercent, alertLevel);
    }

    private String determineAlertLevel(double percent, Integer threshold) {
        int thresholdValue = threshold != null ? threshold : 80;
        if (percent >= 120) {
            return "critical";
        }
        if (percent >= 100) {
            return "alert";
        }
        if (percent >= thresholdValue) {
            return "warning";
        }
        return "normal";
    }

    private void ensureNoDuplicate(User user, Category category, int month, int year, Long ignoreId) {
        budgetRepository.findByUserAndCategoryAndMonthAndYear(user, category, month, year)
            .filter(existing -> ignoreId == null || !existing.getId().equals(ignoreId))
            .ifPresent(budget -> {
                throw new ConflictException("Budget already exists for this category and month");
            });
    }

    private void validateMonthYear(int month, int year) {
        if (month < 1 || month > 12) {
            throw new BadRequestException("Month must be between 1 and 12");
        }
        if (year < 2000 || year > 2100) {
            throw new BadRequestException("Year must be between 2000 and 2100");
        }
    }

    private Category resolveCategory(Long categoryId, User user) {
        Category category = categoryRepository.findByIdAndUser(categoryId, user)
            .orElseThrow(() -> new BadRequestException("Category not found"));
        if (category.getType() != CategoryType.EXPENSE) {
            throw new BadRequestException("Budgets can only target expense categories");
        }
        return category;
    }

    private User currentUser() {
        String email = currentUserProvider.getCurrentUsername();
        if (email == null) {
            throw new BadRequestException("Unable to resolve current user");
        }
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new BadRequestException("User not found"));
    }

    private OffsetDateTime startOfMonth(int year, int month) {
        return OffsetDateTime.of(year, month, 1, 0, 0, 0, 0, ZoneOffset.UTC);
    }

    private OffsetDateTime endOfMonth(int year, int month) {
        LocalDate lastDay = LocalDate.of(year, month, 1).withDayOfMonth(LocalDate.of(year, month, 1).lengthOfMonth());
        return OffsetDateTime.of(lastDay, LocalTime.MAX, ZoneOffset.UTC);
    }

    private BigDecimal safeSum(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private int thresholdValue(Integer alertThresholdPercent) {
        if (alertThresholdPercent == null) {
            return 80;
        }
        return Math.max(0, Math.min(200, alertThresholdPercent));
    }
}
