package com.finance.tracker.dto.budget;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record BudgetRequest(
    @NotNull @Positive @JsonAlias("categoryId") Long categoryId,
    @NotNull @Min(1) @Max(12) Integer month,
    @NotNull @Min(2000) Integer year,
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    @Min(0) @Max(200) @JsonAlias("alertThresholdPercent") Integer alertThresholdPercent
) {
}
