package com.finance.tracker.dto.dashboard;

import java.math.BigDecimal;

public record TrendPointDto(String label, BigDecimal income, BigDecimal expense) {
}
