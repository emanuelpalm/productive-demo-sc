package sc_demo.sysop.data;

import se.arkalix.dto.DtoReadableAs;

import static se.arkalix.dto.DtoEncoding.JSON;

@DtoReadableAs(JSON)
public interface SrMgmtInterface {
    String createdAt();

    int id();

    String interfaceName();

    String updatedAt();
}