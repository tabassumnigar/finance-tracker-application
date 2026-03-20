package com.finance.tracker.dto.dashboard;

import java.math.BigDecimal;

public record BudgetProgressDto(Long id, String categoryName, BigDecimal limitAmount, BigDecimal spent, double progress) {
}
