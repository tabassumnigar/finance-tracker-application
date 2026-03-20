package com.finance.tracker.dto.dashboard;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record RecurringItemDto(
    Long id,
    String description,
    BigDecimal amount,
    String frequency,
    OffsetDateTime nextRun,
    String accountName
) {
}
