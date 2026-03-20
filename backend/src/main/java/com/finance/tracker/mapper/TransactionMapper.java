package com.finance.tracker.mapper;

import com.finance.tracker.dto.transaction.TransactionDto;
import com.finance.tracker.entity.Transaction;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public interface TransactionMapper {
    static TransactionDto toDto(Transaction transaction) {
        return new TransactionDto(
            transaction.getId(),
            transaction.getAccount().getId(),
            transaction.getTransferAccount() != null ? transaction.getTransferAccount().getId() : null,
            transaction.getCategory() != null ? transaction.getCategory().getId() : null,
            transaction.getType().name(),
            transaction.getAmount(),
            transaction.getDescription(),
            transaction.getMerchant(),
            transaction.getPaymentMethod(),
            splitTags(transaction.getTags()),
            transaction.getTransactionDate(),
            transaction.getCreatedAt(),
            transaction.getUpdatedAt(),
            transaction.getRecurringTransactionId()
        );
    }

    static List<String> splitTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(tags.split(","))
            .map(String::trim)
            .filter(tag -> !tag.isEmpty())
            .collect(Collectors.toList());
    }
}
