package com.finance.tracker.repository;

import com.finance.tracker.entity.Category;
import com.finance.tracker.entity.CategoryType;
import com.finance.tracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserAndArchivedFalseOrderByType(User user);

    List<Category> findByUserOrderByType(User user);

    boolean existsByUserAndNameIgnoreCaseAndTypeAndArchivedFalse(User user, String name, CategoryType type);

    Optional<Category> findByIdAndUser(Long id, User user);

    long countByUser(User user);
}
