package com.finance.tracker.dto.goal;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record GoalRequest(
    @NotBlank(message = "Name is required") String name,
    @NotNull @DecimalMin(value = "0.01", message = "Target amount must be positive")
    @JsonAlias("targetAmount") BigDecimal targetAmount,
    @NotNull @JsonAlias("targetDate") OffsetDateTime targetDate,
    @JsonAlias("linkedAccountId")
    Long linkedAccountId,
    String icon,
    String color
) {
}
