package com.finance.tracker.util;

import java.time.OffsetDateTime;

public final class DateUtils {
    private DateUtils() {}

    public static OffsetDateTime nowUtc() {
        return OffsetDateTime.now();
    }
}
