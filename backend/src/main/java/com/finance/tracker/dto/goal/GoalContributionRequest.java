package com.finance.tracker.dto.goal;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record GoalContributionRequest(
    @NotNull @DecimalMin(value = "0.01", message = "Amount must be greater than zero") BigDecimal amount,
    @JsonAlias("sourceAccountId")
    Long sourceAccountId
) {
}
