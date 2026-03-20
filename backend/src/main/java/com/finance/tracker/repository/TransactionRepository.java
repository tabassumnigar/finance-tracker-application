package com.finance.tracker.repository;

import com.finance.tracker.dto.dashboard.CategorySpendingDto;
import com.finance.tracker.entity.Account;
import com.finance.tracker.entity.Category;
import com.finance.tracker.entity.Transaction;
import com.finance.tracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUser(User user);

    List<Transaction> findByUserAndTransactionDateBetween(User user, OffsetDateTime from, OffsetDateTime to);

    List<Transaction> findTop5ByUserOrderByTransactionDateDesc(User user);

    @Query("""
        select coalesce(sum(t.amount), 0)
        from Transaction t
        where t.user = :user
          and t.type = :type
          and t.transactionDate >= :from
          and t.transactionDate <= :to
        """)
    BigDecimal sumByTypeBetween(
        @Param("user") User user,
        @Param("type") Transaction.TransactionType type,
        @Param("from") OffsetDateTime from,
        @Param("to") OffsetDateTime to
    );

    @Query("""
        select new com.finance.tracker.dto.dashboard.CategorySpendingDto(
            cat.id,
            cat.name,
            cat.color,
            coalesce(sum(t.amount), 0)
        )
        from Transaction t
        join t.category cat
        where t.user = :user
          and t.type = :type
          and t.transactionDate >= :from
          and t.transactionDate <= :to
        group by cat.id, cat.name, cat.color
        order by sum(t.amount) desc
        """)
    List<CategorySpendingDto> sumSpendingByCategory(
        @Param("user") User user,
        @Param("type") Transaction.TransactionType type,
        @Param("from") OffsetDateTime from,
        @Param("to") OffsetDateTime to
    );

    @Query("""
        select coalesce(sum(t.amount), 0)
        from Transaction t
        where t.user = :user
          and t.category.id = :categoryId
          and t.type = :type
          and t.transactionDate >= :from
          and t.transactionDate <= :to
        """)
    BigDecimal sumByCategoryAndPeriod(
        @Param("user") User user,
        @Param("categoryId") Long categoryId,
        @Param("type") Transaction.TransactionType type,
        @Param("from") OffsetDateTime from,
        @Param("to") OffsetDateTime to
    );

    boolean existsByRecurringTransactionIdAndTransactionDate(Long recurringTransactionId, OffsetDateTime transactionDate);

    long countByCategory(Category category);

    boolean existsByAccountOrTransferAccount(Account account, Account transferAccount);
}
