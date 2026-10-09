package com.campusclubs.config;

import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.info.*;
import io.swagger.v3.oas.models.security.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI campusClubsOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("CampusClubs API")
                .version("1.0.0")
                .description("REST API for the CampusClubs platform — Spring Boot + MySQL + MongoDB")
                .contact(new Contact().name("CampusClubs Team")))
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
            .components(new Components()
                .addSecuritySchemes("bearerAuth",
                    new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")));
    }
}
