package com.finance.tracker.dto.recurring;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.finance.tracker.entity.RecurringFrequency;
import com.finance.tracker.entity.Transaction;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record RecurringRequest(
    @NotBlank(message = "Title is required")
    String title,
    @NotNull(message = "Type is required")
    Transaction.TransactionType type,
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    BigDecimal amount,
    @JsonAlias("categoryId")
    Long categoryId,
    @NotNull(message = "Account is required")
    @JsonAlias("accountId")
    Long accountId,
    @JsonAlias("transferAccountId")
    Long transferAccountId,
    @NotNull(message = "Frequency is required")
    RecurringFrequency frequency,
    @NotNull(message = "Start date is required")
    @JsonAlias("startDate")
    OffsetDateTime startDate,
    @JsonAlias("endDate")
    OffsetDateTime endDate,
    @JsonAlias("autoCreateTransaction")
    Boolean autoCreateTransaction,
    Boolean active
) {}
