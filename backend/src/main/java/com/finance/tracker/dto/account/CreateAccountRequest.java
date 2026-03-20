package com.finance.tracker.dto.account;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.finance.tracker.entity.AccountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

public class CreateAccountRequest {

    @NotBlank
    private String name;

    @NotNull
    private AccountType type;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = true)
    @JsonAlias("openingBalance")
    private BigDecimal openingBalance;

    @NotBlank
    @Pattern(regexp = "^[A-Z]{3}$", message = "Currency must be a 3-letter ISO code")
    private String currency;

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

    public void setType(AccountType type) {
        this.type = type;
    }

    public BigDecimal getOpeningBalance() {
        return openingBalance;
    }

    public void setOpeningBalance(BigDecimal openingBalance) {
        this.openingBalance = openingBalance;
    }

    public String getInstitutionName() {
        return institutionName;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public void setInstitutionName(String institutionName) {
        this.institutionName = institutionName;
    }
}
