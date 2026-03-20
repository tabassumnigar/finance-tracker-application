package com.finance.tracker.dto.dashboard;

import java.math.BigDecimal;

public record CategorySpendingDto(Long categoryId, String categoryName, String color, BigDecimal amount) {
}
