package com.finance.tracker.repository;

import com.finance.tracker.entity.Account;
import com.finance.tracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    List<Account> findByUserIdOrderByNameAsc(Long userId);

    Optional<Account> findByIdAndUserId(Long id, Long userId);

    default List<Account> findByUser(User user) {
        return findByUserIdOrderByNameAsc(user.getId());
    }

    default Optional<Account> findByIdAndUser(Long id, User user) {
        return findByIdAndUserId(id, user.getId());
    }

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Account a where a.id = :id and a.userId = :userId")
    Optional<Account> findByIdAndUserIdForUpdate(@Param("id") Long id, @Param("userId") Long userId);
}
