package sc_demo.negotiator;

import se.arkalix.dto.DtoWritableAs;

import java.util.Map;

import static se.arkalix.dto.DtoEncoding.JSON;

@DtoWritableAs(JSON)
public interface InboxEntry {
    Type type();
    long id();
    String sender();
    String receiver();
    Map<String, String> contract();

    enum Type {
        OFFER_ACCEPT,
        OFFER_SUBMIT,
        OFFER_COUNTER,
        OFFER_REJECT,
        CONTRACT
    }
}
