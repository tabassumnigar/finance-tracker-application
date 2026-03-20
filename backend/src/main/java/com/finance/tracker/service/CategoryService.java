package com.finance.tracker.service;

import com.finance.tracker.dto.category.CategoryDto;
import com.finance.tracker.dto.category.CreateCategoryRequest;
import com.finance.tracker.dto.category.UpdateCategoryRequest;
import com.finance.tracker.entity.Category;
import com.finance.tracker.entity.CategoryType;
import com.finance.tracker.entity.User;
import com.finance.tracker.exception.BadRequestException;
import com.finance.tracker.exception.ConflictException;
import com.finance.tracker.exception.ResourceNotFoundException;
import com.finance.tracker.mapper.CategoryMapper;
import com.finance.tracker.repository.CategoryRepository;
import com.finance.tracker.repository.TransactionRepository;
import com.finance.tracker.repository.UserRepository;
import com.finance.tracker.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private static final List<DefaultCategory> DEFAULT_CATEGORIES = List.of(
        new DefaultCategory("Salary", CategoryType.INCOME, "#0EA5E9", "briefcase"),
        new DefaultCategory("Freelance", CategoryType.INCOME, "#22C55E", "code"),
        new DefaultCategory("Bonus", CategoryType.INCOME, "#F97316", "sparkles"),
        new DefaultCategory("Investment", CategoryType.INCOME, "#A855F7", "chart-line"),
        new DefaultCategory("Gift", CategoryType.INCOME, "#EC4899", "gift"),
        new DefaultCategory("Refund", CategoryType.INCOME, "#38BDF8", "arrow-uturn-left"),
        new DefaultCategory("Other", CategoryType.INCOME, "#94A3B8", "dots-horizontal"),
        new DefaultCategory("Food", CategoryType.EXPENSE, "#FB923C", "utensils"),
        new DefaultCategory("Rent", CategoryType.EXPENSE, "#EF4444", "home"),
        new DefaultCategory("Utilities", CategoryType.EXPENSE, "#0284C7", "plug"),
        new DefaultCategory("Transport", CategoryType.EXPENSE, "#14B8A6", "car"),
        new DefaultCategory("Entertainment", CategoryType.EXPENSE, "#C084FC", "music"),
        new DefaultCategory("Shopping", CategoryType.EXPENSE, "#F472B6", "shopping-bag"),
        new DefaultCategory("Health", CategoryType.EXPENSE, "#10B981", "heart"),
        new DefaultCategory("Education", CategoryType.EXPENSE, "#6366F1", "book-open"),
        new DefaultCategory("Travel", CategoryType.EXPENSE, "#0EA5E9", "plane"),
        new DefaultCategory("Subscriptions", CategoryType.EXPENSE, "#FACC15", "repeat"),
        new DefaultCategory("Miscellaneous", CategoryType.EXPENSE, "#94A3B8", "puzzle")
    );

    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;

    public List<CategoryDto> listCategories(boolean includeArchived) {
        List<Category> categories = includeArchived
            ? categoryRepository.findByUserOrderByType(currentUser())
            : categoryRepository.findByUserAndArchivedFalseOrderByType(currentUser());
        categories.sort(
            Comparator.comparing(Category::getType)
                .thenComparing(Category::getName, String.CASE_INSENSITIVE_ORDER));
        return CategoryMapper.toDto(categories);
    }

    public CategoryDto createCategory(CreateCategoryRequest request) {
        User user = currentUser();
        CategoryType type = resolveType(request.type());
        ensureUniqueName(user, request.name(), type);
        Category category = new Category();
        category.setUser(user);
        category.setName(request.name().trim());
        category.setType(type);
        category.setColor(normalizeColor(request.color()));
        category.setIcon(normalizeIcon(request.icon()));
        category.setArchived(false);
        return CategoryMapper.toDto(categoryRepository.save(category));
    }

    public CategoryDto updateCategory(Long id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findByIdAndUser(id, currentUser())
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        CategoryType type = resolveType(request.type());
        boolean nameChanged = !category.getName().equalsIgnoreCase(request.name());
        boolean typeChanged = category.getType() != type;
        if ((nameChanged || typeChanged) && categoryRepository
            .existsByUserAndNameIgnoreCaseAndTypeAndArchivedFalse(category.getUser(), request.name().trim(), type)) {
            throw new ConflictException("Category name already exists");
        }
        category.setName(request.name().trim());
        category.setType(type);
        category.setColor(normalizeColor(request.color()));
        category.setIcon(normalizeIcon(request.icon()));
        return CategoryMapper.toDto(categoryRepository.save(category));
    }

    public void archiveCategory(Long id) {
        Category category = categoryRepository.findByIdAndUser(id, currentUser())
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (transactionRepository.countByCategory(category) > 0) {
            if (!category.isArchived()) {
                category.setArchived(true);
                categoryRepository.save(category);
            }
            return;
        }
        categoryRepository.delete(category);
    }

    public void ensureDefaultCategories(User user) {
        if (user == null) {
            return;
        }
        if (categoryRepository.countByUser(user) > 0) {
            return;
        }
        DEFAULT_CATEGORIES.forEach(seed -> {
            if (!categoryRepository.existsByUserAndNameIgnoreCaseAndTypeAndArchivedFalse(user, seed.name, seed.type)) {
                Category category = new Category();
                category.setUser(user);
                category.setName(seed.name);
                category.setType(seed.type);
                category.setColor(seed.color);
                category.setIcon(seed.icon);
                category.setArchived(false);
                categoryRepository.save(category);
            }
        });
    }

    private void ensureUniqueName(User user, String name, CategoryType type) {
        if (name == null || name.isBlank()) {
            throw new BadRequestException("Name is required");
        }
        if (categoryRepository.existsByUserAndNameIgnoreCaseAndTypeAndArchivedFalse(user, name.trim(), type)) {
            throw new ConflictException("Category name already exists");
        }
    }

    private CategoryType resolveType(String value) {
        try {
            return CategoryType.from(value);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid category type");
        }
    }

    private String normalizeColor(String value) {
        if (value == null || value.isBlank()) {
            return "#60A5FA";
        }
        String normalized = value.trim();
        if (!normalized.startsWith("#")) {
            normalized = "#" + normalized;
        }
        return normalized.toUpperCase();
    }

    private String normalizeIcon(String icon) {
        if (icon == null || icon.isBlank()) {
            return null;
        }
        return icon.trim();
    }

    private User currentUser() {
        String email = currentUserProvider.getCurrentUsername();
        if (email == null) {
            throw new BadRequestException("Unable to resolve current user");
        }
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new BadRequestException("User not found"));
    }

    private record DefaultCategory(String name, CategoryType type, String color, String icon) {}
}
