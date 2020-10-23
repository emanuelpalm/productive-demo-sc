package sc_demo.sysop.data;

import se.arkalix.dto.DtoReadableAs;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static se.arkalix.dto.DtoEncoding.JSON;

@DtoReadableAs(JSON)
public interface SrMgmtEntry {
    Optional<String> createdAt();

    Optional<String> endOfValidity();

    int id();

    List<SrMgmtInterface> interfaces();

    Map<String, String> metadata();

    SrMgmtProvider provider();

    String secure();

    SrMgmtServiceDefinition serviceDefinition();

    String serviceUri();

    Optional<String> updatedAt();

    int version();
}