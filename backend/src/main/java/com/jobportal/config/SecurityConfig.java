package com.jobportal.config;

import com.jobportal.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            )
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/jobs/search", "/jobs/{id}").permitAll()
                .requestMatchers(HttpMethod.GET, "/courses", "/courses/{id}").permitAll()
                .requestMatchers(HttpMethod.GET, "/courses/*/sessions").permitAll()
                .requestMatchers(HttpMethod.GET, "/courses/*/assessment").authenticated()
                .requestMatchers(HttpMethod.GET, "/skills/search").permitAll()
                // Swagger
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                // Course seeker actions
                .requestMatchers(HttpMethod.GET, "/courses/my").hasAuthority("ROLE_JOB_SEEKER")
                .requestMatchers(HttpMethod.POST, "/courses/*/enrol").hasAuthority("ROLE_JOB_SEEKER")
                .requestMatchers(HttpMethod.POST, "/courses/*/lessons/*/complete").hasAuthority("ROLE_JOB_SEEKER")
                .requestMatchers(HttpMethod.POST, "/courses/*/lessons/*/watch-progress").hasAuthority("ROLE_JOB_SEEKER")
                .requestMatchers(HttpMethod.GET, "/courses/*/certificate").hasAuthority("ROLE_JOB_SEEKER")
                .requestMatchers(HttpMethod.POST, "/courses/*/assessment/attempt").hasAuthority("ROLE_JOB_SEEKER")
                .requestMatchers(HttpMethod.GET, "/courses/*/assessment/attempts/my").hasAuthority("ROLE_JOB_SEEKER")
                // Role-protected
                .requestMatchers(HttpMethod.GET, "/provider/company/{id}").authenticated()
                .requestMatchers("/seeker/**").hasAuthority("ROLE_JOB_SEEKER")
                .requestMatchers("/provider/**").hasAuthority("ROLE_JOB_PROVIDER")
                .requestMatchers("/trainer/**").hasAuthority("ROLE_TRAINING_PROVIDER")
                .requestMatchers("/admin/**").hasAuthority("ROLE_ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(Arrays.asList(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
