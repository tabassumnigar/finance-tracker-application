package com.finance.tracker.dto.reports;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record AccountBalanceReport(Long accountId, String accountName, OffsetDateTime date, BigDecimal balance) {}
