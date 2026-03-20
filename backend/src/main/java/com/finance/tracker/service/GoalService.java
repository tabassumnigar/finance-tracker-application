package com.finance.tracker.service;

import com.finance.tracker.dto.goal.GoalContributionRequest;
import com.finance.tracker.dto.goal.GoalDto;
import com.finance.tracker.dto.goal.GoalRequest;
import com.finance.tracker.dto.goal.GoalWithdrawRequest;
import com.finance.tracker.entity.Account;
import com.finance.tracker.entity.Goal;
import com.finance.tracker.entity.Goal.GoalStatus;
import com.finance.tracker.entity.User;
import com.finance.tracker.exception.BadRequestException;
import com.finance.tracker.exception.ResourceNotFoundException;
import com.finance.tracker.mapper.GoalMapper;
import com.finance.tracker.repository.AccountRepository;
import com.finance.tracker.repository.GoalRepository;
import com.finance.tracker.repository.UserRepository;
import com.finance.tracker.security.CurrentUserProvider;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoalService {
    private final GoalRepository goalRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;

    public List<GoalDto> listGoals() {
        User user = currentUser();
        return goalRepository.findByUser(user).stream()
            .map(GoalMapper::toDto)
            .toList();
    }

    @Transactional
    public GoalDto createGoal(GoalRequest request) {
        User user = currentUser();
        validateTargetAmount(request.targetAmount());
        Goal goal = new Goal();
        goal.setUser(user);
        goal.setName(request.name());
        goal.setTargetAmount(request.targetAmount());
        goal.setDueDate(request.targetDate());
        goal.setIcon(request.icon());
        goal.setColor(request.color());
        goal.setCurrentAmount(BigDecimal.ZERO);
        goal.setStatus(GoalStatus.IN_PROGRESS);
        if (request.linkedAccountId() != null) {
            goal.setLinkedAccount(resolveAccount(request.linkedAccountId(), user));
        }
        return GoalMapper.toDto(goalRepository.save(goal));
    }

    @Transactional
    public GoalDto updateGoal(Long id, GoalRequest request) {
        User user = currentUser();
        Goal goal = findGoal(id, user);
        validateTargetAmount(request.targetAmount());
        goal.setName(request.name());
        goal.setTargetAmount(request.targetAmount());
        goal.setDueDate(request.targetDate());
        goal.setIcon(request.icon());
        goal.setColor(request.color());
        if (request.linkedAccountId() != null) {
            goal.setLinkedAccount(resolveAccount(request.linkedAccountId(), user));
        } else {
            goal.setLinkedAccount(null);
        }
        refreshStatus(goal);
        return GoalMapper.toDto(goalRepository.save(goal));
    }

    @Transactional
    public GoalDto contribute(Long id, GoalContributionRequest request) {
        User user = currentUser();
        Goal goal = findGoal(id, user);
        if (request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Contribution must be greater than zero");
        }
        Account account = resolveContributionAccount(goal, request.sourceAccountId());
        if (account != null) {
            ensureSufficient(account, request.amount());
            adjustAccountBalance(account, request.amount().negate());
        }
        goal.setCurrentAmount(goal.getCurrentAmount().add(request.amount()));
        refreshStatus(goal);
        return GoalMapper.toDto(goalRepository.save(goal));
    }

    @Transactional
    public GoalDto withdraw(Long id, GoalWithdrawRequest request) {
        User user = currentUser();
        Goal goal = findGoal(id, user);
        if (request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Withdraw amount must be greater than zero");
        }
        if (goal.getCurrentAmount().compareTo(request.amount()) < 0) {
            throw new BadRequestException("Insufficient goal balance");
        }
        Account account = resolveContributionAccount(goal, request.targetAccountId());
        if (account != null) {
            adjustAccountBalance(account, request.amount());
        }
        goal.setCurrentAmount(goal.getCurrentAmount().subtract(request.amount()));
        refreshStatus(goal);
        return GoalMapper.toDto(goalRepository.save(goal));
    }

    @Transactional
    public void deleteGoal(Long id) {
        User user = currentUser();
        Goal goal = findGoal(id, user);
        goalRepository.delete(goal);
    }

    private void refreshStatus(Goal goal) {
        if (goal.getCurrentAmount().compareTo(goal.getTargetAmount()) >= 0) {
            goal.setStatus(GoalStatus.COMPLETED);
        } else if (goal.getStatus() == GoalStatus.COMPLETED) {
            goal.setStatus(GoalStatus.IN_PROGRESS);
        }
    }

    private Goal findGoal(Long id, User user) {
        return goalRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
    }

    private Account resolveAccount(Long accountId, User user) {
        return accountRepository.findByIdAndUser(accountId, user)
            .orElseThrow(() -> new BadRequestException("Account not found"));
    }

    private Account resolveContributionAccount(Goal goal, Long accountId) {
        Long candidate = accountId != null ? accountId : goal.getLinkedAccount() != null ? goal.getLinkedAccount().getId() : null;
        if (candidate == null) {
            return null;
        }
        return resolveAccount(candidate, goal.getUser());
    }

    private void ensureSufficient(Account account, BigDecimal amount) {
        if (account.getCurrentBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Insufficient balance on account");
        }
    }

    private void adjustAccountBalance(Account account, BigDecimal delta) {
        if (account.getCurrentBalance().add(delta).compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Insufficient balance on account");
        }
        account.setCurrentBalance(account.getCurrentBalance().add(delta));
        account.setLastUpdatedAt(OffsetDateTime.now());
        accountRepository.save(account);
    }

    private void validateTargetAmount(BigDecimal targetAmount) {
        if (targetAmount == null || targetAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Target amount must be greater than zero");
        }
    }

    private User currentUser() {
        String email = currentUserProvider.getCurrentUsername();
        if (email == null) {
            throw new BadRequestException("Unable to resolve current user");
        }
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new BadRequestException("User not found"));
    }
}
