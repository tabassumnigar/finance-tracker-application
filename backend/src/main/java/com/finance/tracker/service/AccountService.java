package com.finance.tracker.service;

import com.finance.tracker.dto.account.AccountResponse;
import com.finance.tracker.dto.account.AccountTransferRequest;
import com.finance.tracker.dto.account.CreateAccountRequest;
import com.finance.tracker.dto.account.UpdateAccountRequest;
import com.finance.tracker.dto.transaction.CreateTransactionRequest;
import com.finance.tracker.entity.Account;
import com.finance.tracker.exception.BadRequestException;
import com.finance.tracker.exception.ResourceNotFoundException;
import com.finance.tracker.repository.AccountRepository;
import com.finance.tracker.repository.TransactionRepository;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;

    public AccountService(
        AccountRepository accountRepository,
        TransactionRepository transactionRepository,
        TransactionService transactionService
    ) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.transactionService = transactionService;
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getAll(Long userId) {
        return accountRepository.findByUserIdOrderByNameAsc(userId)
                .stream()
                .map(AccountResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public AccountResponse getOne(Long userId, Long accountId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        return AccountResponse.from(account);
    }

    @Transactional
    public AccountResponse create(Long userId, CreateAccountRequest request) {
        if (request.getOpeningBalance() == null || request.getOpeningBalance().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Opening balance must be 0 or greater");
        }

        Account account = new Account();
        account.setUserId(userId);
        account.setName(request.getName().trim());
        account.setType(request.getType());
        account.setOpeningBalance(request.getOpeningBalance());
        account.setCurrency(normalizeCurrency(request.getCurrency()));
        account.setCurrentBalance(request.getOpeningBalance());
        account.setInstitutionName(blankToNull(request.getInstitutionName()));
        account.setLastUpdatedAt(OffsetDateTime.now());

        return AccountResponse.from(accountRepository.save(account));
    }

    @Transactional
    public AccountResponse update(Long userId, Long accountId, UpdateAccountRequest request) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        boolean balanceChanged = account.getCurrentBalance().compareTo(request.getCurrentBalance()) != 0;
        if (balanceChanged && transactionRepository.existsByAccountOrTransferAccount(account, account)) {
            throw new BadRequestException(
                "Current balance is ledger-managed once transactions exist. Edit the transaction history instead.");
        }

        account.setName(request.getName().trim());
        account.setType(request.getType());
        account.setCurrency(normalizeCurrency(request.getCurrency()));
        account.setCurrentBalance(request.getCurrentBalance());
        if (balanceChanged) {
            account.setOpeningBalance(request.getCurrentBalance());
        }
        account.setInstitutionName(blankToNull(request.getInstitutionName()));
        account.setLastUpdatedAt(OffsetDateTime.now());

        return AccountResponse.from(accountRepository.save(account));
    }

    @Transactional
    public void transfer(Long userId, AccountTransferRequest request) {
        if (request.getFromAccountId().equals(request.getToAccountId())) {
            throw new BadRequestException("Source and destination accounts must be different");
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Transfer amount must be greater than 0");
        }

        Account from = accountRepository.findByIdAndUserId(request.getFromAccountId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        Account to = accountRepository.findByIdAndUserId(request.getToAccountId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        transactionService.createTransaction(new CreateTransactionRequest(
            from.getId(),
            request.getAmount(),
            transferDescription(from.getName(), to.getName(), request.getNote()),
            "TRANSFER",
            null,
            to.getId(),
            null,
            null,
            null,
            OffsetDateTime.now(),
            null
        ));
    }

    private String blankToNull(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return value.trim();
    }

    private String normalizeCurrency(String value) {
        if (value == null) return "USD";
        return value.trim().toUpperCase();
    }

    private String transferDescription(String fromName, String toName, @Nullable String note) {
        if (note != null && !note.trim().isEmpty()) {
            return note.trim();
        }
        return "Transfer from " + fromName + " to " + toName;
    }
}
