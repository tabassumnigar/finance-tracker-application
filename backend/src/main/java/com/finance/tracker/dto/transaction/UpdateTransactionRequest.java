package com.finance.tracker.dto.transaction;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record UpdateTransactionRequest(
    @NotNull(message = "Account is required")
    @JsonAlias("accountId")
    Long accountId,
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    BigDecimal amount,
    @JsonAlias("note")
    @NotBlank(message = "Description is required")
    @Size(max = 255)
    String description,
    @NotBlank(message = "Type is required")
    String type,
    @JsonAlias("categoryId")
    Long categoryId,
    @JsonAlias("transferAccountId")
    Long transferAccountId,
    String merchant,
    @JsonAlias("paymentMethod")
    String paymentMethod,
    List<String> tags,
    @NotNull(message = "Transaction date is required")
    @JsonAlias("transactionDate")
    OffsetDateTime transactionDate,
    @JsonAlias("recurringTransactionId")
    Long recurringTransactionId
) {}
