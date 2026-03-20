package com.finance.tracker.controller;

import com.finance.tracker.dto.transaction.CreateTransactionRequest;
import com.finance.tracker.dto.transaction.TransactionDto;
import com.finance.tracker.dto.transaction.TransactionFilter;
import com.finance.tracker.dto.transaction.TransactionPage;
import com.finance.tracker.dto.transaction.UpdateTransactionRequest;
import com.finance.tracker.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public ResponseEntity<TransactionPage> list(
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size,
        @RequestParam(required = false) String sortBy,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String type,
        @RequestParam(required = false) Long accountId,
        @RequestParam(required = false) Long categoryId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime toDate,
        @RequestParam(required = false) BigDecimal minAmount,
        @RequestParam(required = false) BigDecimal maxAmount
    ) {
        TransactionFilter filter = new TransactionFilter(page, size, sortBy, type, accountId, categoryId, fromDate, toDate, minAmount, maxAmount, search);
        return ResponseEntity.ok(transactionService.listTransactions(filter));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionDto> detail(@PathVariable Long id) {
        return ResponseEntity.ok(transactionService.getTransaction(id));
    }

    @PostMapping
    public ResponseEntity<TransactionDto> create(@Valid @RequestBody CreateTransactionRequest request) {
        return ResponseEntity.ok(transactionService.createTransaction(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionDto> update(@PathVariable Long id, @Valid @RequestBody UpdateTransactionRequest request) {
        return ResponseEntity.ok(transactionService.updateTransaction(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }
}
