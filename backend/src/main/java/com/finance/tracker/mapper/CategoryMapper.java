package com.finance.tracker.mapper;

import com.finance.tracker.dto.category.CategoryDto;
import com.finance.tracker.entity.Category;

import java.util.List;
import java.util.stream.Collectors;

public interface CategoryMapper {
    static CategoryDto toDto(Category entity) {
        return new CategoryDto(
            entity.getId(),
            entity.getName(),
            entity.getType(),
            entity.getColor(),
            entity.getIcon(),
            entity.isArchived(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    static List<CategoryDto> toDto(List<Category> entities) {
        return entities.stream().map(CategoryMapper::toDto).collect(Collectors.toList());
    }
}
