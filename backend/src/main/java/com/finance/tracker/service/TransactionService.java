package com.finance.tracker.service;

import com.finance.tracker.dto.transaction.CreateTransactionRequest;
import com.finance.tracker.dto.transaction.TransactionDto;
import com.finance.tracker.dto.transaction.TransactionFilter;
import com.finance.tracker.dto.transaction.TransactionPage;
import com.finance.tracker.dto.transaction.UpdateTransactionRequest;
import com.finance.tracker.entity.Account;
import com.finance.tracker.entity.Category;
import com.finance.tracker.entity.Transaction;
import com.finance.tracker.entity.Transaction.TransactionType;
import com.finance.tracker.entity.User;
import com.finance.tracker.exception.BadRequestException;
import com.finance.tracker.exception.ResourceNotFoundException;
import com.finance.tracker.mapper.TransactionMapper;
import com.finance.tracker.repository.AccountRepository;
import com.finance.tracker.repository.CategoryRepository;
import com.finance.tracker.repository.TransactionRepository;
import com.finance.tracker.repository.UserRepository;
import com.finance.tracker.security.CurrentUserProvider;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;
    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public TransactionPage listTransactions(TransactionFilter filter) {
        User user = currentUser();
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Transaction> query = cb.createQuery(Transaction.class);
        Root<Transaction> root = query.from(Transaction.class);
        List<Predicate> predicates = buildPredicates(cb, root, filter, user);

        query.select(root);
        query.where(predicates.toArray(Predicate[]::new));
        query.orderBy(cb.desc(root.get("transactionDate")));

        int pageIndex = sanitizePage(filter.page());
        int pageSize = sanitizeSize(filter.size());
        TypedQuery<Transaction> typedQuery = entityManager.createQuery(query);
        typedQuery.setFirstResult(pageIndex * pageSize);
        typedQuery.setMaxResults(pageSize);
        List<Transaction> transactions = typedQuery.getResultList();

        TypedQuery<Long> countQuery = entityManager.createQuery(createCountQuery(filter, user, cb));
        long total = countQuery.getSingleResult();

        List<TransactionDto> items = transactions.stream().map(TransactionMapper::toDto).toList();
        return new TransactionPage(items, total, pageIndex, pageSize);
    }

    @Transactional(readOnly = true)
    public TransactionDto getTransaction(Long id) {
        User user = currentUser();
        Transaction transaction = transactionRepository.findById(id)
            .filter(tx -> tx.getUser().getId().equals(user.getId()))
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        return TransactionMapper.toDto(transaction);
    }

    @Transactional
    public TransactionDto createTransaction(CreateTransactionRequest request) {
        User user = currentUser();
        Account account = accountRepository.findByIdAndUser(request.accountId(), user)
            .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        TransactionType type = resolveType(request.type());
        Category category = null;
        if (type != TransactionType.TRANSFER) {
            if (request.categoryId() == null) {
                throw new BadRequestException("Category is required for this transaction");
            }
            category = categoryRepository.findByIdAndUser(request.categoryId(), user)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }
        Account transferAccount = null;
        if (type == TransactionType.TRANSFER) {
            if (request.transferAccountId() == null || request.transferAccountId().equals(account.getId())) {
                throw new BadRequestException("Provide a different destination account");
            }
            transferAccount = accountRepository.findByIdAndUser(request.transferAccountId(), user)
                .orElseThrow(() -> new ResourceNotFoundException("Destination account not found"));
        }

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setAccount(account);
        transaction.setTransferAccount(transferAccount);
        transaction.setAmount(request.amount());
        transaction.setDescription(request.description());
        transaction.setMerchant(request.merchant());
        transaction.setPaymentMethod(request.paymentMethod());
        transaction.setTags(joinTags(request.tags()));
        transaction.setRecurringTransactionId(request.recurringTransactionId());
        transaction.setTransactionDate(request.transactionDate() != null ? request.transactionDate() : OffsetDateTime.now());
        transaction.setType(type);
        transaction.setCategory(category);

        applyBalances(transaction);
        Transaction saved = transactionRepository.save(transaction);
        return TransactionMapper.toDto(saved);
    }

    @Transactional
    public TransactionDto updateTransaction(Long id, UpdateTransactionRequest request) {
        User user = currentUser();
        Transaction existing = transactionRepository.findById(id)
            .filter(tx -> tx.getUser().getId().equals(user.getId()))
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        revertBalances(existing);

        Account account = accountRepository.findByIdAndUser(request.accountId(), user)
            .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        TransactionType type = resolveType(request.type());
        Category category = null;
        if (type != TransactionType.TRANSFER) {
            if (request.categoryId() == null) {
                throw new BadRequestException("Category is required for this transaction");
            }
            category = categoryRepository.findByIdAndUser(request.categoryId(), user)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }
        Account transferAccount = null;
        if (type == TransactionType.TRANSFER) {
            if (request.transferAccountId() == null || request.transferAccountId().equals(account.getId())) {
                throw new BadRequestException("Provide a different destination account");
            }
            transferAccount = accountRepository.findByIdAndUser(request.transferAccountId(), user)
                .orElseThrow(() -> new ResourceNotFoundException("Destination account not found"));
        }

        existing.setAccount(account);
        existing.setTransferAccount(transferAccount);
        existing.setCategory(category);
        existing.setAmount(request.amount());
        existing.setDescription(request.description());
        existing.setMerchant(request.merchant());
        existing.setPaymentMethod(request.paymentMethod());
        existing.setTags(joinTags(request.tags()));
        existing.setRecurringTransactionId(request.recurringTransactionId());
        existing.setTransactionDate(request.transactionDate());
        existing.setType(type);

        applyBalances(existing);
        Transaction updated = transactionRepository.save(existing);
        return TransactionMapper.toDto(updated);
    }

    @Transactional
    public void deleteTransaction(Long id) {
        User user = currentUser();
        Transaction transaction = transactionRepository.findById(id)
            .filter(tx -> tx.getUser().getId().equals(user.getId()))
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        revertBalances(transaction);
        transactionRepository.delete(transaction);
    }

    private User currentUser() {
        String email = currentUserProvider.getCurrentUsername();
        if (email == null) {
            throw new BadRequestException("Unable to resolve current user");
        }
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new BadRequestException("User not found"));
    }

    private List<Predicate> buildPredicates(CriteriaBuilder cb, Root<Transaction> root, TransactionFilter filter, User user) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.equal(root.get("user"), user));
        if (filter.accountId() != null) {
            predicates.add(cb.equal(root.get("account").get("id"), filter.accountId()));
        }
        if (filter.categoryId() != null) {
            predicates.add(cb.equal(root.get("category").get("id"), filter.categoryId()));
        }
        if (filter.type() != null) {
            predicates.add(cb.equal(root.get("type"), resolveType(filter.type())));
        }
        if (filter.search() != null && !filter.search().isBlank()) {
            String like = "%" + filter.search().trim().toLowerCase() + "%";
            predicates.add(cb.or(
                cb.like(cb.lower(root.get("description")), like),
                cb.like(cb.lower(root.get("merchant")), like)
            ));
        }
        if (filter.fromDate() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("transactionDate"), filter.fromDate()));
        }
        if (filter.toDate() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("transactionDate"), filter.toDate()));
        }
        if (filter.minAmount() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("amount"), filter.minAmount()));
        }
        if (filter.maxAmount() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("amount"), filter.maxAmount()));
        }
        return predicates;
    }

    private CriteriaQuery<Long> createCountQuery(TransactionFilter filter, User user, CriteriaBuilder cb) {
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Transaction> root = countQuery.from(Transaction.class);
        List<Predicate> countPredicates = buildPredicates(cb, root, filter, user);
        countQuery.select(cb.count(root));
        countQuery.where(countPredicates.toArray(Predicate[]::new));
        return countQuery;
    }

    private TransactionType resolveType(String type) {
        try {
            return TransactionType.valueOf(type.trim().toUpperCase());
        } catch (Exception ex) {
            throw new BadRequestException("Invalid transaction type");
        }
    }

    private void applyBalances(Transaction transaction) {
        if (transaction.getType() == TransactionType.TRANSFER && transaction.getTransferAccount() != null) {
            adjustBalance(transaction.getAccount(), transaction.getAmount().negate());
            adjustBalance(transaction.getTransferAccount(), transaction.getAmount());
        } else if (transaction.getType() == TransactionType.INCOME) {
            adjustBalance(transaction.getAccount(), transaction.getAmount());
        } else if (transaction.getType() == TransactionType.EXPENSE) {
            adjustBalance(transaction.getAccount(), transaction.getAmount().negate());
        }
    }

    private void revertBalances(Transaction transaction) {
        if (transaction.getType() == TransactionType.TRANSFER && transaction.getTransferAccount() != null) {
            adjustBalance(transaction.getAccount(), transaction.getAmount());
            adjustBalance(transaction.getTransferAccount(), transaction.getAmount().negate());
        } else if (transaction.getType() == TransactionType.INCOME) {
            adjustBalance(transaction.getAccount(), transaction.getAmount().negate());
        } else if (transaction.getType() == TransactionType.EXPENSE) {
            adjustBalance(transaction.getAccount(), transaction.getAmount());
        }
    }

    private void adjustBalance(Account account, BigDecimal delta) {
        ensureSufficient(account, delta);
        account.setCurrentBalance(account.getCurrentBalance().add(delta));
        account.setLastUpdatedAt(OffsetDateTime.now());
        accountRepository.save(account);
    }

    private void ensureSufficient(Account account, BigDecimal delta) {
        BigDecimal target = account.getCurrentBalance().add(delta);
        if (target.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Insufficient balance on " + account.getName());
        }
    }

    private int sanitizePage(Integer page) {
        return page != null && page >= 0 ? page : 0;
    }

    private int sanitizeSize(Integer size) {
        if (size == null || size <= 0) {
            return 20;
        }
        return Math.min(size, 100);
    }

    private String joinTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return null;
        }
        return String.join(",", tags);
    }
}
