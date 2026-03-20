package com.finance.tracker.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI financeTrackerApi() {
        final var securitySchemeName = "bearerAuth";
        return new OpenAPI()
            .components(new Components().addSecuritySchemes(securitySchemeName,
                new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")))
            .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
            .info(new Info().title("Personal Finance Tracker API").version("0.1.0"));
    }
}
