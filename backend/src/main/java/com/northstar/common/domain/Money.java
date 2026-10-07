package com.northstar.common.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Immutable Value Object representing monetary amounts in minor units (cents).
 * Prevents primitive obsession and floating point rounding errors.
 */
public record Money(long amountCents, String currency) {

    public Money {
        Objects.requireNonNull(currency, "Currency must not be null");
        if (currency.length() != 3) {
            throw new IllegalArgumentException("Currency must be a 3-letter ISO code: " + currency);
        }
        currency = currency.toUpperCase();
    }

    public static Money ofCents(long amountCents, String currency) {
        return new Money(amountCents, currency);
    }

    public static Money of(BigDecimal amount, String currency) {
        Objects.requireNonNull(amount, "Amount must not be null");
        long cents = amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();
        return new Money(cents, currency);
    }

    public static Money usd(long amountCents) {
        return new Money(amountCents, "USD");
    }

    public static Money zero(String currency) {
        return new Money(0, currency);
    }

    public Money plus(Money other) {
        assertSameCurrency(other);
        return new Money(this.amountCents + other.amountCents, this.currency);
    }

    public Money minus(Money other) {
        assertSameCurrency(other);
        return new Money(this.amountCents - other.amountCents, this.currency);
    }

    public Money multiply(int factor) {
        return new Money(this.amountCents * factor, this.currency);
    }

    public boolean isPositive() {
        return this.amountCents > 0;
    }

    public boolean isZeroOrPositive() {
        return this.amountCents >= 0;
    }

    private void assertSameCurrency(Money other) {
        if (!this.currency.equalsIgnoreCase(other.currency)) {
            throw new IllegalArgumentException(
                    "Cannot operate on different currencies: " + this.currency + " vs " + other.currency);
        }
    }
}
