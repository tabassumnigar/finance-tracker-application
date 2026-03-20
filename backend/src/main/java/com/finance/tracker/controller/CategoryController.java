package com.finance.tracker.controller;

import com.finance.tracker.dto.category.CategoryDto;
import com.finance.tracker.dto.category.CreateCategoryRequest;
import com.finance.tracker.dto.category.UpdateCategoryRequest;
import com.finance.tracker.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryDto>> list(@RequestParam(defaultValue = "false") boolean includeArchived) {
        return ResponseEntity.ok(categoryService.listCategories(includeArchived));
    }

    @PostMapping
    public ResponseEntity<CategoryDto> create(@Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.ok(categoryService.createCategory(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryDto> update(
        @PathVariable Long id,
        @Valid @RequestBody UpdateCategoryRequest request
    ) {
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archive(@PathVariable Long id) {
        categoryService.archiveCategory(id);
        return ResponseEntity.noContent().build();
    }
}
