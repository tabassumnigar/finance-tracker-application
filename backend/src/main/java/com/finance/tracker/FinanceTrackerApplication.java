package com.finance.tracker;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FinanceTrackerApplication {
    private static final Logger log = LoggerFactory.getLogger(FinanceTrackerApplication.class);

    public static void main(String[] args) {
        log.info("UPDATED BUILD LOADED");
        SpringApplication.run(FinanceTrackerApplication.class, args);
    }
}
