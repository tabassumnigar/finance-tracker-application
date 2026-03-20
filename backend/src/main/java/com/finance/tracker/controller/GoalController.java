package com.finance.tracker.controller;

import com.finance.tracker.dto.goal.GoalContributionRequest;
import com.finance.tracker.dto.goal.GoalDto;
import com.finance.tracker.dto.goal.GoalRequest;
import com.finance.tracker.dto.goal.GoalWithdrawRequest;
import com.finance.tracker.service.GoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {
    private final GoalService goalService;

    @GetMapping
    public ResponseEntity<List<GoalDto>> list() {
        return ResponseEntity.ok(goalService.listGoals());
    }

    @PostMapping
    public ResponseEntity<GoalDto> create(@Valid @RequestBody GoalRequest request) {
        return ResponseEntity.status(201).body(goalService.createGoal(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalDto> update(@PathVariable Long id, @Valid @RequestBody GoalRequest request) {
        return ResponseEntity.ok(goalService.updateGoal(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        goalService.deleteGoal(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/contribute")
    public ResponseEntity<GoalDto> contribute(@PathVariable Long id, @Valid @RequestBody GoalContributionRequest request) {
        return ResponseEntity.ok(goalService.contribute(id, request));
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<GoalDto> withdraw(@PathVariable Long id, @Valid @RequestBody GoalWithdrawRequest request) {
        return ResponseEntity.ok(goalService.withdraw(id, request));
    }
}
