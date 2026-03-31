package com.finance.portfoliobackend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration // 告诉 Spring Boot 这是一个配置类，启动时要加载它
public class SwaggerConfig {

    @Bean
    public OpenAPI portfolioOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("📈 投资组合管理系统 API (Portfolio Manager)")
                        .description("咱们团队的后端 RESTful API 接口文档。支持在线调试！")
                        .version("v1.0.0"));
    }
}