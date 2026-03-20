package com.finance.tracker.controller;

import com.finance.tracker.dto.recurring.RecurringRequest;
import com.finance.tracker.dto.recurring.RecurringResponse;
import com.finance.tracker.service.RecurringService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recurring")
@RequiredArgsConstructor
public class RecurringController {
    private final RecurringService recurringService;

    @GetMapping
    public ResponseEntity<List<RecurringResponse>> list() {
        return ResponseEntity.ok(recurringService.listRecurring());
    }

    @PostMapping
    public ResponseEntity<RecurringResponse> create(@Valid @RequestBody RecurringRequest request) {
        return ResponseEntity.status(201).body(recurringService.createRecurring(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecurringResponse> update(@PathVariable Long id, @Valid @RequestBody RecurringRequest request) {
        return ResponseEntity.ok(recurringService.updateRecurring(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        recurringService.deleteRecurring(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<RecurringResponse> toggle(@PathVariable Long id) {
        return ResponseEntity.ok(recurringService.toggleActive(id));
    }
}
