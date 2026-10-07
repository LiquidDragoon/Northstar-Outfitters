package com.northstar.common.domain;

public class ResourceNotFoundException extends DomainException {
    public ResourceNotFoundException(String resource, String identifier) {
        super("RESOURCE_NOT_FOUND", "%s not found with identifier: %s".formatted(resource, identifier));
    }
}
