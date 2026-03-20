package com.finance.tracker.dto.budget;

import java.math.BigDecimal;

public record BudgetDto(
    Long id,
    Long categoryId,
    String categoryName,
    int month,
    int year,
    BigDecimal amount,
    BigDecimal spent,
    double progressPercent,
    int alertThresholdPercent,
    String alertLevel
) {
}
