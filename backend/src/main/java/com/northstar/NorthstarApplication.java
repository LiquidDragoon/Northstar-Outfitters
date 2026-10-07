package com.northstar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NorthstarApplication {

    public static void main(String[] args) {
        SpringApplication.run(NorthstarApplication.class, args);
    }
}
