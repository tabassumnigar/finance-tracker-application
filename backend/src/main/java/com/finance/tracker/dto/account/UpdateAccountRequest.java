package com.finance.tracker.dto.account;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.finance.tracker.entity.AccountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

public class UpdateAccountRequest {

    @NotBlank
    private String name;

    @NotNull
    private AccountType type;

    @NotBlank
    @Pattern(regexp = "^[A-Z]{3}$", message = "Currency must be a 3-letter ISO code")
    private String currency;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = true)
    @JsonAlias("currentBalance")
    private BigDecimal currentBalance;

    @JsonAlias("institutionName")
    private String institutionName;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public AccountType getType() {
        return type;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getCurrentBalance() {
        return currentBalance;
    }

    public void setCurrentBalance(BigDecimal currentBalance) {
        this.currentBalance = currentBalance;
    }

    public void setType(AccountType type) {
        this.type = type;
    }

    public String getInstitutionName() {
        return institutionName;
    }

    public void setInstitutionName(String institutionName) {
        this.institutionName = institutionName;
    }
}
