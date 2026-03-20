package com.finance.tracker.dto.account;

import com.finance.tracker.entity.AccountType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record AccountDto(
    Long id,
    String name,
    AccountType type,
    String currency,
    BigDecimal openingBalance,
    BigDecimal currentBalance,
    String institutionName,
    OffsetDateTime lastUpdatedAt
) {}
