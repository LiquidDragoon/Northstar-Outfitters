package com.northstar.common.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Base contract for all immutable Domain Events emitted within the modular
 * monolith.
 */
public interface DomainEvent {
    UUID eventId();

    Instant occurredAt();

    String aggregateType();

    String aggregateId();
}
