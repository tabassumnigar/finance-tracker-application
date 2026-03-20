package com.finance.tracker.entity;

public enum CategoryType {
    INCOME,
    EXPENSE;

    public static CategoryType from(String value) {
        try {
            return CategoryType.valueOf(value.trim().toUpperCase());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid category type");
        }
    }
}
