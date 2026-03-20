package com.finance.tracker.dto.recurring;

import com.finance.tracker.entity.RecurringFrequency;
import com.finance.tracker.entity.Transaction;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record RecurringResponse(
    Long id,
    String title,
    Transaction.TransactionType type,
    BigDecimal amount,
    Long categoryId,
    String categoryName,
    Long accountId,
    String accountName,
    Long transferAccountId,
    String transferAccountName,
    RecurringFrequency frequency,
    OffsetDateTime startDate,
    OffsetDateTime endDate,
    OffsetDateTime nextRun,
    OffsetDateTime lastRun,
    boolean autoCreateTransaction,
    boolean active
) {}
