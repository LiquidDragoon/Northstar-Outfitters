package com.northstar.common.domain;

public class InsufficientStockException extends DomainException {
    private final String sku;
    private final int requested;
    private final int available;

    public InsufficientStockException(String sku, int requested, int available) {
        super("INVENTORY_INSUFFICIENT",
                "Insufficient sellable stock for SKU '%s'. Requested: %d, Available: %d".formatted(sku, requested,
                        available));
        this.sku = sku;
        this.requested = requested;
        this.available = available;
    }

    public String getSku() {
        return sku;
    }

    public int getRequested() {
        return requested;
    }

    public int getAvailable() {
        return available;
    }
}
