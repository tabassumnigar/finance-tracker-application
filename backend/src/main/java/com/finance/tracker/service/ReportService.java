package com.finance.tracker.service;

import com.finance.tracker.dto.dashboard.TrendPointDto;
import com.finance.tracker.dto.reports.AccountBalanceReport;
import com.finance.tracker.dto.reports.CategorySpendReport;
import com.finance.tracker.dto.reports.ReportFilter;
import com.finance.tracker.entity.Account;
import com.finance.tracker.entity.Category;
import com.finance.tracker.entity.Transaction;
import com.finance.tracker.entity.User;
import com.finance.tracker.exception.BadRequestException;
import com.finance.tracker.repository.AccountRepository;
import com.finance.tracker.repository.CategoryRepository;
import com.finance.tracker.repository.TransactionRepository;
import com.finance.tracker.repository.UserRepository;
import com.finance.tracker.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;

    public List<CategorySpendReport> categorySpend(ReportFilter filter) {
        User user = currentUser();
        OffsetDateTime start = determineStart(filter);
        OffsetDateTime end = determineEnd(filter);
        validateRange(start, end);
        validateOwnership(user, filter);
        Transaction.TransactionType type = filter.transactionType() != null ? filter.transactionType() : Transaction.TransactionType.EXPENSE;
        List<Transaction> transactions = loadTransactions(user, filter, start, end);
        List<Transaction> relevant = transactions.stream()
            .filter(tx -> tx.getType() == type && tx.getCategory() != null)
            .collect(Collectors.toList());
        BigDecimal total = relevant.stream()
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<Category, BigDecimal> sums = new HashMap<>();
        relevant.forEach(tx -> sums.merge(tx.getCategory(), tx.getAmount(), BigDecimal::add));
        return sums.entrySet().stream()
            .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
            .map(entry -> {
                BigDecimal percent = total.compareTo(BigDecimal.ZERO) == 0
                    ? BigDecimal.ZERO
                    : entry.getValue().divide(total, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
                Category category = entry.getKey();
                return new CategorySpendReport(
                    category.getId(),
                    category.getName(),
                    category.getColor(),
                    category.getIcon(),
                    entry.getValue(),
                    percent.setScale(2, RoundingMode.HALF_UP)
                );
            })
            .collect(Collectors.toList());
    }

    public List<TrendPointDto> incomeVsExpense(ReportFilter filter) {
        User user = currentUser();
        OffsetDateTime start = determineStart(filter);
        OffsetDateTime end = determineEnd(filter);
        validateRange(start, end);
        validateOwnership(user, filter);
        List<Transaction> transactions = loadTransactions(user, filter, start, end);
        Map<LocalDate, TrendAccumulator> timeline = new TreeMap<>();
        for (Transaction tx : transactions) {
            LocalDate key = tx.getTransactionDate().toLocalDate();
            TrendAccumulator accumulator = timeline.computeIfAbsent(key, k -> new TrendAccumulator());
            if (tx.getType() == Transaction.TransactionType.INCOME) {
                accumulator.income = accumulator.income.add(tx.getAmount());
            } else if (tx.getType() == Transaction.TransactionType.EXPENSE) {
                accumulator.expense = accumulator.expense.add(tx.getAmount());
            }
        }
        if (timeline.isEmpty()) {
            timeline.put(start.toLocalDate(), new TrendAccumulator());
        }
        return timeline.entrySet().stream()
            .map(entry -> new TrendPointDto(entry.getKey().toString(), entry.getValue().income, entry.getValue().expense))
            .collect(Collectors.toList());
    }

    public List<AccountBalanceReport> accountBalanceTrend(ReportFilter filter) {
        User user = currentUser();
        OffsetDateTime start = determineStart(filter);
        OffsetDateTime end = determineEnd(filter);
        validateRange(start, end);
        validateOwnership(user, filter);
        List<Transaction> transactions = loadTransactions(user, filter, start, end);
        List<Account> accounts = resolveAccounts(user, filter.accountId());
        List<AccountBalanceReport> results = new ArrayList<>();
        for (Account account : accounts) {
            List<Transaction> accountTransactions = transactions.stream()
                .filter(tx -> matchesAccount(tx, account.getId()))
                .sorted(Comparator.comparing(Transaction::getTransactionDate))
                .collect(Collectors.toList());
            BigDecimal running = account.getOpeningBalance() != null ? account.getOpeningBalance() : BigDecimal.ZERO;
            Map<LocalDate, BigDecimal> timeline = new TreeMap<>();
            timeline.put(start.toLocalDate(), running);
            for (Transaction tx : accountTransactions) {
                running = running.add(deltaForAccount(tx, account));
                timeline.put(tx.getTransactionDate().toLocalDate(), running);
            }
            timeline.forEach((date, balance) -> results.add(new AccountBalanceReport(
                account.getId(),
                account.getName(),
                date.atTime(LocalTime.MIDNIGHT).atOffset(ZoneOffset.UTC),
                balance
            )));
        }
        return results;
    }

    public byte[] exportCsv(ReportFilter filter) {
        User user = currentUser();
        OffsetDateTime start = determineStart(filter);
        OffsetDateTime end = determineEnd(filter);
        validateRange(start, end);
        validateOwnership(user, filter);
        List<Transaction> transactions = loadTransactions(user, filter, start, end);
        StringBuilder builder = new StringBuilder();
        builder.append("Date,Type,Account,Transfer Account,Category,Amount,Description,Merchant,Payment Method\n");
        for (Transaction tx : transactions) {
            builder.append(escape(tx.getTransactionDate().toString())).append(',');
            builder.append(tx.getType()).append(',');
            builder.append(escape(tx.getAccount().getName())).append(',');
            builder.append(escape(tx.getTransferAccount() != null ? tx.getTransferAccount().getName() : null)).append(',');
            builder.append(escape(tx.getCategory() != null ? tx.getCategory().getName() : null)).append(',');
            builder.append(tx.getAmount()).append(',');
            builder.append(escape(tx.getDescription())).append(',');
            builder.append(escape(tx.getMerchant())).append(',');
            builder.append(escape(tx.getPaymentMethod())).append('\n');
        }
        return builder.toString().getBytes(StandardCharsets.UTF_8);
    }

    private List<Transaction> loadTransactions(User user, ReportFilter filter, OffsetDateTime start, OffsetDateTime end) {
        return transactionRepository.findByUserAndTransactionDateBetween(user, start, end).stream()
            .filter(tx -> filter.accountId() == null || matchesAccount(tx, filter.accountId()))
            .filter(tx -> filter.categoryId() == null || matchesCategory(tx, filter.categoryId()))
            .filter(tx -> filter.transactionType() == null || tx.getType() == filter.transactionType())
            .sorted(Comparator.comparing(Transaction::getTransactionDate))
            .collect(Collectors.toList());
    }

    private boolean matchesAccount(Transaction transaction, Long accountId) {
        if (accountId == null) {
            return true;
        }
        if (transaction.getAccount() != null && accountId.equals(transaction.getAccount().getId())) {
            return true;
        }
        return transaction.getTransferAccount() != null && accountId.equals(transaction.getTransferAccount().getId());
    }

    private boolean matchesCategory(Transaction transaction, Long categoryId) {
        if (categoryId == null) {
            return true;
        }
        return transaction.getCategory() != null && categoryId.equals(transaction.getCategory().getId());
    }

    private BigDecimal deltaForAccount(Transaction transaction, Account account) {
        if (transaction.getAccount() != null && account.getId().equals(transaction.getAccount().getId())) {
            return switch (transaction.getType()) {
                case INCOME -> transaction.getAmount();
                case EXPENSE -> transaction.getAmount().negate();
                case TRANSFER -> transaction.getAmount().negate();
            };
        }
        if (transaction.getTransferAccount() != null && account.getId().equals(transaction.getTransferAccount().getId())) {
            return transaction.getAmount();
        }
        return BigDecimal.ZERO;
    }

    private List<Account> resolveAccounts(User user, Long accountId) {
        if (accountId == null) {
            return accountRepository.findByUser(user);
        }
        return accountRepository.findByIdAndUser(accountId, user)
            .map(List::of)
            .orElseThrow(() -> new BadRequestException("Account not found"));
    }

    private void validateOwnership(User user, ReportFilter filter) {
        if (filter.accountId() != null) {
            accountRepository.findByIdAndUser(filter.accountId(), user)
                .orElseThrow(() -> new BadRequestException("Account not found"));
        }
        if (filter.categoryId() != null) {
            categoryRepository.findByIdAndUser(filter.categoryId(), user)
                .orElseThrow(() -> new BadRequestException("Category not found"));
        }
    }

    private OffsetDateTime determineStart(ReportFilter filter) {
        return filter.startDate() != null ? filter.startDate() : OffsetDateTime.now().minusDays(30);
    }

    private OffsetDateTime determineEnd(ReportFilter filter) {
        return filter.endDate() != null ? filter.endDate() : OffsetDateTime.now();
    }

    private void validateRange(OffsetDateTime start, OffsetDateTime end) {
        if (start.isAfter(end)) {
            throw new BadRequestException("Start date must be before end date");
        }
    }

    private User currentUser() {
        String email = currentUserProvider.getCurrentUsername();
        if (email == null) {
            throw new BadRequestException("Unable to resolve current user");
        }
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new BadRequestException("User not found"));
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }

    private static final class TrendAccumulator {
        private BigDecimal income = BigDecimal.ZERO;
        private BigDecimal expense = BigDecimal.ZERO;
    }
}
