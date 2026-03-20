package com.finance.tracker.dto.dashboard;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record GoalProgressDto(
    Long id,
    String name,
    BigDecimal targetAmount,
    BigDecimal currentAmount,
    double progress,
    String status,
    OffsetDateTime dueDate
) {
}
