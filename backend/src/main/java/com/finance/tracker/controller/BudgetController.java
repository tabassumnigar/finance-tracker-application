package com.finance.tracker.controller;

import com.finance.tracker.dto.budget.BudgetDto;
import com.finance.tracker.dto.budget.BudgetRequest;
import com.finance.tracker.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {
    private final BudgetService budgetService;

    @GetMapping
    public ResponseEntity<List<BudgetDto>> list(
        @RequestParam(required = false) Integer month,
        @RequestParam(required = false) Integer year
    ) {
        LocalDate now = LocalDate.now();
        int targetMonth = month != null ? month : now.getMonthValue();
        int targetYear = year != null ? year : now.getYear();
        return ResponseEntity.ok(budgetService.listBudgets(targetMonth, targetYear));
    }

    @PostMapping
    public ResponseEntity<BudgetDto> create(@Valid @RequestBody BudgetRequest request) {
        BudgetDto dto = budgetService.createBudget(request);
        return ResponseEntity.status(201).body(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetDto> update(@PathVariable Long id, @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(budgetService.updateBudget(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/duplicate-last-month")
    public ResponseEntity<List<BudgetDto>> duplicateLastMonth(
        @RequestParam(required = false) Integer month,
        @RequestParam(required = false) Integer year
    ) {
        LocalDate now = LocalDate.now();
        int targetMonth = month != null ? month : now.getMonthValue();
        int targetYear = year != null ? year : now.getYear();
        return ResponseEntity.ok(budgetService.duplicateLastMonth(targetMonth, targetYear));
    }
}
