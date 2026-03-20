package com.finance.tracker.dto.goal;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record GoalDto(
    Long id,
    String name,
    BigDecimal targetAmount,
    BigDecimal currentAmount,
    double progressPercent,
    OffsetDateTime targetDate,
    Long linkedAccountId,
    String linkedAccountName,
    String icon,
    String color,
    String status
) {
}
