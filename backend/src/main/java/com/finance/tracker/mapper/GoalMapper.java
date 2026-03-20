package com.finance.tracker.mapper;

import com.finance.tracker.dto.goal.GoalDto;
import com.finance.tracker.entity.Goal;

import java.math.BigDecimal;
import java.math.RoundingMode;

public interface GoalMapper {
    static GoalDto toDto(Goal goal) {
        double progressPercent = calculateProgressPercent(goal);
        return new GoalDto(
            goal.getId(),
            goal.getName(),
            goal.getTargetAmount(),
            goal.getCurrentAmount(),
            progressPercent,
            goal.getDueDate(),
            goal.getLinkedAccount() != null ? goal.getLinkedAccount().getId() : null,
            goal.getLinkedAccount() != null ? goal.getLinkedAccount().getName() : null,
            goal.getIcon(),
            goal.getColor(),
            goal.getStatus().name()
        );
    }

    static double calculateProgressPercent(Goal goal) {
        if (goal.getTargetAmount() == null || goal.getTargetAmount().compareTo(BigDecimal.ZERO) == 0) {
            return 0;
        }
        double ratio = goal.getCurrentAmount().divide(goal.getTargetAmount(), 4, RoundingMode.HALF_UP).doubleValue();
        return Math.min(200, Math.max(0, ratio * 100));
    }
}
