package com.finance.tracker.repository;

import com.finance.tracker.entity.Budget;
import com.finance.tracker.entity.Category;
import com.finance.tracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUser(User user);

    List<Budget> findByUserAndMonthAndYear(User user, int month, int year);

    Optional<Budget> findByIdAndUser(Long id, User user);

    Optional<Budget> findByUserAndCategoryAndMonthAndYear(User user, Category category, int month, int year);
}
