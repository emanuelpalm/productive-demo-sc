package sc_demo.negotiator;

import se.arkalix.dto.DtoReadableAs;

import java.util.Map;
import java.util.Optional;

import static se.arkalix.dto.DtoEncoding.JSON;

@DtoReadableAs(JSON)
public interface ClientOffer {
    Optional<Long> id();
    String receiver();
    Map<String, String> contract();
    ClientTemplate template();
}
