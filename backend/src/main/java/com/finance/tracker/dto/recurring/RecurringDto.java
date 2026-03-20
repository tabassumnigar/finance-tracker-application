package com.finance.tracker.dto.recurring;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record RecurringDto(Long id, BigDecimal amount, String frequency, OffsetDateTime nextRun) {
}
