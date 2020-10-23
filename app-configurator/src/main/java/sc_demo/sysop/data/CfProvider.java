package sc_demo.sysop.data;

import se.arkalix.core.plugin.SystemDetailsBuilder;
import se.arkalix.core.plugin.SystemDetailsDto;
import se.arkalix.dto.DtoReadableAs;
import se.arkalix.dto.DtoToString;

import static se.arkalix.dto.DtoEncoding.JSON;

@DtoReadableAs(JSON)
@DtoToString
public interface CfProvider {
    String address();

    String authenticationInfo();

    int port();

    String systemName();

    default SystemDetailsDto toDetails() {
        return new SystemDetailsBuilder()
            .hostname(address())
            .publicKeyBase64(authenticationInfo())
            .port(port())
            .name(systemName())
            .build();
    }
}
