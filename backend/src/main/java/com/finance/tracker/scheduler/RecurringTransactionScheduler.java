package com.finance.tracker.scheduler;

import com.finance.tracker.service.RecurringService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RecurringTransactionScheduler {
    private final RecurringService recurringService;

    @Scheduled(fixedRateString = "PT1H")
    public void scheduleRecurring() {
        recurringService.processDueRecurring();
    }
}
