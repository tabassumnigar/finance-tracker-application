package com.finance.tracker.dto.transaction;

import java.util.List;

public record TransactionPage(
    List<TransactionDto> items,
    long total,
    int page,
    int size
) {}
