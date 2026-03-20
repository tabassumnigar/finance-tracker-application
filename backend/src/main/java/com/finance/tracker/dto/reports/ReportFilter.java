package com.finance.tracker.dto.reports;

import com.finance.tracker.entity.Transaction;

import java.time.OffsetDateTime;

public record ReportFilter(
    OffsetDateTime startDate,
    OffsetDateTime endDate,
    Long accountId,
    Long categoryId,
    Transaction.TransactionType transactionType
) {}
