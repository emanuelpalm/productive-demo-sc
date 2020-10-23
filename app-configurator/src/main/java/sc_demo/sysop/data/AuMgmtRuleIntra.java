package sc_demo.sysop.data;

import se.arkalix.dto.DtoWritableAs;

import java.util.List;

import static se.arkalix.dto.DtoEncoding.JSON;

@DtoWritableAs(JSON)
public interface AuMgmtRuleIntra {
    int consumerId();

    List<Integer> interfaceIds();

    List<Integer> providerIds();

    List<Integer> serviceDefinitionIds();
}