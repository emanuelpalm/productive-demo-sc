package sc_demo.negotiator;

import se.arkalix.dto.DtoWritableAs;

import static se.arkalix.dto.DtoEncoding.JSON;

@DtoWritableAs(JSON)
public interface Template {
    String name();
    String label();
    String text();
}
