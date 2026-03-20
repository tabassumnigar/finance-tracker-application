package com.finance.tracker.dto.transaction;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record TransactionFilter(
    Integer page,
    Integer size,
    String sortBy,
    String type,
    Long accountId,
    Long categoryId,
    OffsetDateTime fromDate,
    OffsetDateTime toDate,
    BigDecimal minAmount,
    BigDecimal maxAmount,
    String search
) {
    public TransactionFilter {
        if (page == null || page < 0) {
            page = 0;
        }
        if (size == null || size <= 0) {
            size = 10;
        }
    }
}
