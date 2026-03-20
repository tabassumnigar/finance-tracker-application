package com.finance.tracker.dto.transaction;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record TransactionDto(
    Long id,
    Long accountId,
    Long transferAccountId,
    Long categoryId,
    String type,
    BigDecimal amount,
    String description,
    String merchant,
    String paymentMethod,
    List<String> tags,
    OffsetDateTime transactionDate,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    Long recurringTransactionId
) {}
