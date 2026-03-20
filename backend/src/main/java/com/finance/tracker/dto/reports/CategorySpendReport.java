package com.finance.tracker.dto.reports;

import java.math.BigDecimal;

public record CategorySpendReport(
    Long categoryId,
    String categoryName,
    String color,
    String icon,
    BigDecimal amount,
    BigDecimal percentage
) {}
