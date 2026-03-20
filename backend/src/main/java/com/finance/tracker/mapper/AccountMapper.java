package com.finance.tracker.mapper;

import com.finance.tracker.dto.account.AccountDto;
import com.finance.tracker.entity.Account;

public interface AccountMapper {
    static AccountDto toDto(Account account) {
        return new AccountDto(
            account.getId(),
            account.getName(),
            account.getType(),
            account.getCurrency(),
            account.getOpeningBalance(),
            account.getCurrentBalance(),
            account.getInstitutionName(),
            account.getLastUpdatedAt()
        );
    }
}
