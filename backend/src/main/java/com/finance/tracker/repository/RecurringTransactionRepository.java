package com.finance.tracker.repository;

import com.finance.tracker.entity.RecurringTransaction;
import com.finance.tracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction, Long> {
    List<RecurringTransaction> findByUser(User user);

    Optional<RecurringTransaction> findByIdAndUser(Long id, User user);

    List<RecurringTransaction> findByActiveTrueAndAutoCreateTransactionTrueAndNextRunLessThanEqual(OffsetDateTime dateTime);
}
