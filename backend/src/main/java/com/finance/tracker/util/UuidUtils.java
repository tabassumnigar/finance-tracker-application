package com.finance.tracker.util;

import java.util.UUID;

public final class UuidUtils {
    private UuidUtils() {}

    public static String random() {
        return UUID.randomUUID().toString();
    }
}
