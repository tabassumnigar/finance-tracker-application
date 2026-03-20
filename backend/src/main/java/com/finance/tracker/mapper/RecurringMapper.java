package com.finance.tracker.mapper;

import com.finance.tracker.dto.recurring.RecurringResponse;
import com.finance.tracker.entity.RecurringTransaction;

public interface RecurringMapper {
    static RecurringResponse toResponse(RecurringTransaction recurring) {
        return new RecurringResponse(
            recurring.getId(),
            recurring.getTitle(),
            recurring.getType(),
            recurring.getAmount(),
            recurring.getCategory() != null ? recurring.getCategory().getId() : null,
            recurring.getCategory() != null ? recurring.getCategory().getName() : null,
            recurring.getAccount().getId(),
            recurring.getAccount().getName(),
            recurring.getTransferAccount() != null ? recurring.getTransferAccount().getId() : null,
            recurring.getTransferAccount() != null ? recurring.getTransferAccount().getName() : null,
            recurring.getFrequency(),
            recurring.getStartDate(),
            recurring.getEndDate(),
            recurring.getNextRun(),
            recurring.getLastRun(),
            recurring.isAutoCreateTransaction(),
            recurring.isActive()
        );
    }
}
