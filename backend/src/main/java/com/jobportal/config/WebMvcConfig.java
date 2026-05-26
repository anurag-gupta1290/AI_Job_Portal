package com.jobportal.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.storage.use-s3:false}")
    private boolean useS3;

    @Value("${app.storage.local.upload-dir:./uploads}")
    private String localUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        if (!useS3) {
            String location = "file:" + Paths.get(localUploadDir).toAbsolutePath() + "/";
            registry.addResourceHandler("/uploads/**")
                    .addResourceLocations(location);
        }
    }
}