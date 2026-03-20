package com.finance.tracker.mapper;

import com.finance.tracker.dto.budget.BudgetDto;
import com.finance.tracker.entity.Budget;
import java.math.BigDecimal;

public interface BudgetMapper {
    static BudgetDto toDto(Budget budget, BigDecimal spentAmount, double progressPercent, String alertLevel) {
        return new BudgetDto(
            budget.getId(),
            budget.getCategory().getId(),
            budget.getCategory().getName(),
            budget.getMonth(),
            budget.getYear(),
            budget.getLimitAmount(),
            spentAmount,
            progressPercent,
            budget.getAlertThresholdPercent(),
            alertLevel
        );
    }

}
