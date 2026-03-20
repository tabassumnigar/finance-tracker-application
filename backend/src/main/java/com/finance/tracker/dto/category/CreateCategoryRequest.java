package com.finance.tracker.dto.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateCategoryRequest(
    @NotBlank(message = "Name is required")
    String name,
    @NotBlank(message = "Category type is required")
    String type,
    @Pattern(regexp = "^#?[0-9A-Fa-f]{6}$", message = "Color must be a valid hex code")
    String color,
    String icon
) {
}
