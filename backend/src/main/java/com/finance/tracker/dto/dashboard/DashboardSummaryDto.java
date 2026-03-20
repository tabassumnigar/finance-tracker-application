package com.finance.tracker.dto.dashboard;

import java.math.BigDecimal;

public record DashboardSummaryDto(
    BigDecimal currentMonthIncome,
    BigDecimal currentMonthExpense,
    BigDecimal netBalance,
    BigDecimal totalBalance,
    BigDecimal totalBudget,
    BigDecimal totalSavings,
    int activeBudgets,
    int upcomingRecurring
) {
}
