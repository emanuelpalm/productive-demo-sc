package sc_demo.sysop.data;

import se.arkalix.dto.DtoWritableAs;

import static se.arkalix.dto.DtoEncoding.JSON;

@DtoWritableAs(JSON)
public interface OrMgmtProvider {
    String address();

    String authenticationInfo();

    int port();

    String systemName();
}