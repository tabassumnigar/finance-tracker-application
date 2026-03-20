package com.finance.tracker.service;

import com.finance.tracker.dto.recurring.RecurringRequest;
import com.finance.tracker.dto.recurring.RecurringResponse;
import com.finance.tracker.dto.transaction.CreateTransactionRequest;
import com.finance.tracker.entity.Account;
import com.finance.tracker.entity.Category;
import com.finance.tracker.entity.RecurringFrequency;
import com.finance.tracker.entity.RecurringTransaction;
import com.finance.tracker.entity.Transaction;
import com.finance.tracker.entity.User;
import com.finance.tracker.exception.BadRequestException;
import com.finance.tracker.exception.ResourceNotFoundException;
import com.finance.tracker.mapper.RecurringMapper;
import com.finance.tracker.repository.AccountRepository;
import com.finance.tracker.repository.CategoryRepository;
import com.finance.tracker.repository.RecurringTransactionRepository;
import com.finance.tracker.repository.TransactionRepository;
import com.finance.tracker.repository.UserRepository;
import com.finance.tracker.security.CurrentUserProvider;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecurringService {
    private final RecurringTransactionRepository recurringRepository;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;
    private final TransactionService transactionService;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;

    @Transactional
    public RecurringResponse createRecurring(RecurringRequest request) {
        User user = currentUser();
        Category category = resolveCategory(request.categoryId(), request.type());
        Account account = resolveAccount(request.accountId(), user);
        Account transferAccount = resolveTransferAccount(request.transferAccountId(), request.type(), user);
        if (request.endDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new BadRequestException("End date cannot be before start date");
        }
        RecurringTransaction recurring = new RecurringTransaction();
        recurring.setUser(user);
        recurring.setTitle(request.title());
        recurring.setType(request.type());
        recurring.setAmount(request.amount());
        recurring.setCategory(category);
        recurring.setAccount(account);
        recurring.setTransferAccount(transferAccount);
        recurring.setFrequency(request.frequency());
        recurring.setStartDate(request.startDate());
        recurring.setEndDate(request.endDate());
        recurring.setAutoCreateTransaction(request.autoCreateTransaction() == null ? true : request.autoCreateTransaction());
        recurring.setActive(request.active() == null ? true : request.active());
        recurring.setNextRun(normalizeNextRun(request.startDate(), request.frequency(), request.endDate()));
        recurring.setLastRun(null);
        RecurringTransaction saved = recurringRepository.save(recurring);
        return RecurringMapper.toResponse(saved);
    }

    @Transactional
    public RecurringResponse updateRecurring(Long id, RecurringRequest request) {
        User user = currentUser();
        RecurringTransaction recurring = findByIdAndUser(id, user);
        Category category = resolveCategory(request.categoryId(), request.type());
        Account account = resolveAccount(request.accountId(), user);
        Account transferAccount = resolveTransferAccount(request.transferAccountId(), request.type(), user);
        if (request.endDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new BadRequestException("End date cannot be before start date");
        }
        recurring.setTitle(request.title());
        recurring.setType(request.type());
        recurring.setAmount(request.amount());
        recurring.setCategory(category);
        recurring.setAccount(account);
        recurring.setTransferAccount(transferAccount);
        recurring.setFrequency(request.frequency());
        recurring.setStartDate(request.startDate());
        recurring.setEndDate(request.endDate());
        recurring.setAutoCreateTransaction(request.autoCreateTransaction() == null ? recurring.isAutoCreateTransaction()
            : request.autoCreateTransaction());
        recurring.setActive(request.active() == null ? recurring.isActive() : request.active());
        OffsetDateTime reference = recurring.getLastRun() != null ? recurring.getLastRun() : request.startDate();
        recurring.setNextRun(normalizeNextRun(reference, request.frequency(), request.endDate()));
        return RecurringMapper.toResponse(recurringRepository.save(recurring));
    }

    public List<RecurringResponse> listRecurring() {
        User user = currentUser();
        return recurringRepository.findByUser(user).stream()
            .map(RecurringMapper::toResponse)
            .toList();
    }

    @Transactional
    public void deleteRecurring(Long id) {
        RecurringTransaction recurring = findByIdAndUser(id, currentUser());
        recurringRepository.delete(recurring);
    }

    @Transactional
    public RecurringResponse toggleActive(Long id) {
        RecurringTransaction recurring = findByIdAndUser(id, currentUser());
        recurring.setActive(!recurring.isActive());
        return RecurringMapper.toResponse(recurringRepository.save(recurring));
    }

    @Transactional
    public void processDueRecurring() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        List<RecurringTransaction> due = recurringRepository.findByActiveTrueAndAutoCreateTransactionTrueAndNextRunLessThanEqual(now);
        for (RecurringTransaction recurring : due) {
            if (!isWithinEnd(recurring.getNextRun(), recurring.getEndDate())) {
                recurring.setActive(false);
                recurringRepository.save(recurring);
                continue;
            }
            OffsetDateTime runDate = recurring.getNextRun();
            if (transactionRepository.existsByRecurringTransactionIdAndTransactionDate(recurring.getId(), runDate)) {
                recurring.setNextRun(calculateNextRun(runDate, recurring.getFrequency()));
                recurringRepository.save(recurring);
                continue;
            }
            CreateTransactionRequest transactionRequest = buildTransactionRequest(recurring, runDate);
            transactionService.createTransaction(transactionRequest);
            recurring.setLastRun(runDate);
            recurring.setNextRun(calculateNextRun(runDate, recurring.getFrequency()));
            recurringRepository.save(recurring);
        }
    }

    private RecurringTransaction findByIdAndUser(Long id, User user) {
        return recurringRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new ResourceNotFoundException("Recurring item not found"));
    }

    private RecurringResponse buildResponse(RecurringTransaction recurring) {
        return RecurringMapper.toResponse(recurring);
    }

    private CreateTransactionRequest buildTransactionRequest(RecurringTransaction recurring, OffsetDateTime runDate) {
        Long categoryId = recurring.getCategory() != null ? recurring.getCategory().getId() : null;
        Long transferAccountId = recurring.getTransferAccount() != null ? recurring.getTransferAccount().getId() : null;
        return new CreateTransactionRequest(
            recurring.getAccount().getId(),
            recurring.getAmount(),
            recurring.getTitle(),
            recurring.getType().name(),
            categoryId,
            transferAccountId,
            recurring.getTitle(),
            null,
            null,
            runDate,
            recurring.getId()
        );
    }

    private Account resolveAccount(Long accountId, User user) {
        return accountRepository.findByIdAndUser(accountId, user)
            .orElseThrow(() -> new BadRequestException("Account not found"));
    }

    private Account resolveTransferAccount(Long transferAccountId, Transaction.TransactionType type, User user) {
        if (type != Transaction.TransactionType.TRANSFER) {
            return null;
        }
        if (transferAccountId == null) {
            throw new BadRequestException("Transfer destination is required");
        }
        return resolveAccount(transferAccountId, user);
    }

    private Category resolveCategory(Long categoryId, Transaction.TransactionType type) {
        if (type == Transaction.TransactionType.TRANSFER) {
            return null;
        }
        if (categoryId == null) {
            throw new BadRequestException("Category is required");
        }
        User user = currentUser();
        return categoryRepository.findByIdAndUser(categoryId, user)
            .orElseThrow(() -> new BadRequestException("Category not found"));
    }

    private User currentUser() {
        String email = currentUserProvider.getCurrentUsername();
        if (email == null) {
            throw new BadRequestException("Unable to resolve current user");
        }
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new BadRequestException("User not found"));
    }

    private OffsetDateTime normalizeNextRun(OffsetDateTime reference, RecurringFrequency frequency, OffsetDateTime endDate) {
        OffsetDateTime candidate = reference;
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        while (candidate.isBefore(now) && isWithinEnd(candidate, endDate)) {
            candidate = calculateNextRun(candidate, frequency);
        }
        return candidate.isBefore(now) ? calculateNextRun(candidate, frequency) : candidate;
    }

    private OffsetDateTime calculateNextRun(OffsetDateTime reference, RecurringFrequency frequency) {
        return switch (frequency) {
            case DAILY -> reference.plusDays(1);
            case WEEKLY -> reference.plusWeeks(1);
            case MONTHLY -> reference.plusMonths(1);
            case YEARLY -> reference.plusYears(1);
        };
    }

    private boolean isWithinEnd(OffsetDateTime date, OffsetDateTime endDate) {
        return endDate == null || !date.isAfter(endDate);
    }
}
