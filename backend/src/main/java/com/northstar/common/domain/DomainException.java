package com.northstar.common.domain;

/**
 * Base unchecked exception for business rule and invariant violations.
 */
public class DomainException extends RuntimeException {
    private final String errorCode;

    public DomainException(String message) {
        super(message);
        this.errorCode = "DOMAIN_RULE_VIOLATION";
    }

    public DomainException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
