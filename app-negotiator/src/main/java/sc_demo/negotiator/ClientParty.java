package sc_demo.negotiator;

import se.arkalix.dto.DtoWritableAs;

import static se.arkalix.dto.DtoEncoding.JSON;

@DtoWritableAs(JSON)
public interface ClientParty {
    String name();
    String label();
}
