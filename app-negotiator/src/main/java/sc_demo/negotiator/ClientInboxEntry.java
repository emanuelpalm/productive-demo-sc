package sc_demo.negotiator;

import se.arkalix.core.plugin.cp.TrustedContractOffer;
import se.arkalix.dto.DtoWritableAs;

import java.util.Optional;

import static se.arkalix.dto.DtoEncoding.JSON;

@DtoWritableAs(JSON)
public interface ClientInboxEntry {
    Type type();
    long id();
    Optional<TrustedContractOffer> offer();
    Optional<String> error();

    enum Type {
        CONTRACT,
        OFFER_ACCEPT,
        OFFER_COUNTER,
        OFFER_EXPIRY,
        OFFER_FAULT,
        OFFER_REJECT,
        OFFER_SUBMIT,
    }
}
