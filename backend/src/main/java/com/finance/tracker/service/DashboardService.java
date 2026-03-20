package com.finance.tracker.service;

import com.finance.tracker.dto.dashboard.BudgetProgressDto;
import com.finance.tracker.dto.dashboard.CategorySpendingDto;
import com.finance.tracker.dto.dashboard.DashboardSummaryDto;
import com.finance.tracker.dto.dashboard.GoalProgressDto;
import com.finance.tracker.dto.dashboard.RecurringItemDto;
import com.finance.tracker.dto.dashboard.TrendPointDto;
import com.finance.tracker.dto.transaction.TransactionDto;
import com.finance.tracker.entity.Account;
import com.finance.tracker.entity.Budget;
import com.finance.tracker.entity.Goal;
import com.finance.tracker.entity.RecurringTransaction;
import com.finance.tracker.entity.Transaction;
import com.finance.tracker.entity.Transaction.TransactionType;
import com.finance.tracker.entity.User;
import com.finance.tracker.exception.BadRequestException;
import com.finance.tracker.mapper.TransactionMapper;
import com.finance.tracker.repository.AccountRepository;
import com.finance.tracker.repository.BudgetRepository;
import com.finance.tracker.repository.GoalRepository;
import com.finance.tracker.repository.RecurringTransactionRepository;
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
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(Transactional.TxType.SUPPORTS)
public class DashboardService {
    private static final DateTimeFormatter LABEL_FORMATTER = DateTimeFormatter.ofPattern("MMM d");

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final BudgetRepository budgetRepository;
    private final GoalRepository goalRepository;
    private final RecurringTransactionRepository recurringTransactionRepository;
    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(Transactional.TxType.REQUIRED)
    public DashboardSummaryDto getSummary() {
        User user = currentUser();
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime monthStart = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        OffsetDateTime monthEnd = monthStart.plusMonths(1).minusNanos(1);

        BigDecimal income = safeSum(transactionRepository.sumByTypeBetween(user, TransactionType.INCOME, monthStart, monthEnd));
        BigDecimal expense = safeSum(transactionRepository.sumByTypeBetween(user, TransactionType.EXPENSE, monthStart, monthEnd));
        BigDecimal netBalance = income.subtract(expense);
        BigDecimal totalBalance = accountRepository.findByUser(user).stream()
            .map(Account::getCurrentBalance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Budget> budgets = budgetRepository.findByUser(user);
        BigDecimal totalBudget = budgets.stream()
            .map(Budget::getLimitAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<Goal> goals = goalRepository.findByUser(user);
        BigDecimal totalSavings = goals.stream()
            .map(Goal::getCurrentAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        int activeBudgets = budgets.size();
        int upcomingRecurring = (int) recurringTransactionRepository.findByUser(user).stream()
            .filter(RecurringTransaction::isActive)
            .filter(rec -> !rec.getNextRun().isBefore(now))
            .count();

        return new DashboardSummaryDto(
            income,
            expense,
            netBalance,
            totalBalance,
            totalBudget,
            totalSavings,
            activeBudgets,
            upcomingRecurring
        );
    }

    public List<CategorySpendingDto> getSpendingByCategory() {
        User user = currentUser();
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime monthStart = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        OffsetDateTime monthEnd = monthStart.plusMonths(1).minusNanos(1);
        return transactionRepository.sumSpendingByCategory(user, TransactionType.EXPENSE, monthStart, monthEnd);
    }

    public List<TrendPointDto> getIncomeVsExpenseTrend() {
        User user = currentUser();
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime windowStart = now.minusDays(13).withHour(0).withMinute(0).withSecond(0).withNano(0);
        Map<LocalDate, TrendAccumulator> buckets = new LinkedHashMap<>();
        for (int i = 0; i < 14; i++) {
            LocalDate day = windowStart.toLocalDate().plusDays(i);
            buckets.put(day, new TrendAccumulator());
        }

        transactionRepository
            .findByUserAndTransactionDateBetween(user, windowStart, now)
            .forEach(tx -> {
                LocalDate date = tx.getTransactionDate().toLocalDate();
                TrendAccumulator accumulator = buckets.computeIfAbsent(date, d -> new TrendAccumulator());
                if (tx.getType() == TransactionType.INCOME) {
                    accumulator.addIncome(tx.getAmount());
                } else if (tx.getType() == TransactionType.EXPENSE) {
                    accumulator.addExpense(tx.getAmount());
                }
            });

        return buckets.entrySet().stream()
            .map(entry -> new TrendPointDto(
                entry.getKey().format(LABEL_FORMATTER),
                entry.getValue().income(),
                entry.getValue().expense()
            ))
            .toList();
    }

    public List<TransactionDto> getRecentTransactions() {
        User user = currentUser();
        return transactionRepository.findTop5ByUserOrderByTransactionDateDesc(user).stream()
            .map(TransactionMapper::toDto)
            .toList();
    }

    public List<RecurringItemDto> getUpcomingRecurring() {
        User user = currentUser();
        OffsetDateTime now = OffsetDateTime.now();
        return recurringTransactionRepository.findByUser(user).stream()
            .filter(RecurringTransaction::isActive)
            .filter(rec -> !rec.getNextRun().isBefore(now))
            .sorted(Comparator.comparing(RecurringTransaction::getNextRun))
            .limit(5)
            .map(rec -> new RecurringItemDto(
                rec.getId(),
                rec.getTitle(),
                rec.getAmount(),
                rec.getFrequency().name(),
                rec.getNextRun(),
                rec.getAccount().getName()
            ))
            .toList();
    }

    public List<BudgetProgressDto> getBudgetProgress() {
        User user = currentUser();
        List<Budget> budgets = budgetRepository.findByUser(user);
        return budgets.stream()
            .map(budget -> {
                BigDecimal limit = budget.getLimitAmount() != null ? budget.getLimitAmount() : BigDecimal.ZERO;
                BigDecimal spent = spentForBudget(user, budget);
                double progress = limit.compareTo(BigDecimal.ZERO) == 0
                    ? 0
                    : spent.divide(limit, 4, RoundingMode.HALF_UP).doubleValue();
                String categoryName = budget.getCategory() != null ? budget.getCategory().getName() : "Uncategorized";
                return new BudgetProgressDto(
                    budget.getId(),
                    categoryName,
                    limit,
                    spent,
                    clamp(progress)
                );
            })
            .toList();
    }

    public List<GoalProgressDto> getGoalsSummary() {
        User user = currentUser();
        List<Goal> goals = goalRepository.findByUser(user);
        return goals.stream()
            .map(goal -> {
                BigDecimal target = goal.getTargetAmount() != null ? goal.getTargetAmount() : BigDecimal.ZERO;
                BigDecimal current = goal.getCurrentAmount() != null ? goal.getCurrentAmount() : BigDecimal.ZERO;
                double progress = target.compareTo(BigDecimal.ZERO) == 0
                    ? 0
                    : current.divide(target, 4, RoundingMode.HALF_UP).doubleValue();
                return new GoalProgressDto(
                    goal.getId(),
                    goal.getName(),
                    target,
                    current,
                    clamp(progress),
                    goal.getStatus().name(),
                    goal.getDueDate()
                );
            })
            .toList();
    }

    private double clamp(double value) {
        if (value < 0) {
            return 0;
        }
        return Math.min(1, value);
    }

    private User currentUser() {
        String email = currentUserProvider.getCurrentUsername();
        if (email == null) {
            throw new BadRequestException("Unable to resolve current user");
        }
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new BadRequestException("User not found"));
    }

    private BigDecimal safeSum(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private BigDecimal spentForBudget(User user, Budget budget) {
        if (budget.getCategory() == null) {
            return BigDecimal.ZERO;
        }
        LocalDate start = LocalDate.of(budget.getYear(), budget.getMonth(), 1);
        OffsetDateTime from = OffsetDateTime.of(start, LocalTime.MIDNIGHT, ZoneOffset.UTC);
        OffsetDateTime to = OffsetDateTime.of(start.plusMonths(1).minusDays(1), LocalTime.MAX, ZoneOffset.UTC);
        return safeSum(transactionRepository.sumByCategoryAndPeriod(
            user,
            budget.getCategory().getId(),
            TransactionType.EXPENSE,
            from,
            to
        ));
    }

    private static class TrendAccumulator {
        private BigDecimal income = BigDecimal.ZERO;
        private BigDecimal expense = BigDecimal.ZERO;

        void addIncome(BigDecimal amount) {
            if (amount != null) {
                income = income.add(amount);
            }
        }

        void addExpense(BigDecimal amount) {
            if (amount != null) {
                expense = expense.add(amount);
            }
        }

        BigDecimal income() {
            return income;
        }

        BigDecimal expense() {
            return expense;
        }
    }
}
