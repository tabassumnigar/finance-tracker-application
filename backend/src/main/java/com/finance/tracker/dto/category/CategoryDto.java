package com.finance.tracker.dto.category;

import com.finance.tracker.entity.Category;
import com.finance.tracker.entity.CategoryType;

import java.time.OffsetDateTime;

public record CategoryDto(
    Long id,
    String name,
    CategoryType type,
    String color,
    String icon,
    boolean archived,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
