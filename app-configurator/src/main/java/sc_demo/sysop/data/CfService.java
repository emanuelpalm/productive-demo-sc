package sc_demo.sysop.data;

import se.arkalix.core.plugin.sr.ServiceRegistrationBuilder;
import se.arkalix.core.plugin.sr.ServiceRegistrationDto;
import se.arkalix.descriptor.InterfaceDescriptor;
import se.arkalix.descriptor.SecurityDescriptor;
import se.arkalix.dto.DtoReadableAs;
import se.arkalix.dto.DtoToString;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static se.arkalix.dto.DtoEncoding.JSON;

@DtoReadableAs(JSON)
@DtoToString
public interface CfService {
    String serviceDefinition();

    int providerIndex();

    String serviceUri();

    Optional<SecurityDescriptor> secure();

    Map<String, String> metadata();

    Optional<Integer> version();

    List<InterfaceDescriptor> interfaces();

    default ServiceRegistrationDto toRegistrationUsing(final List<CfProvider> providers) {
        return new ServiceRegistrationBuilder()
            .name(serviceDefinition())
            .provider(providers.get(providerIndex()).toDetails())
            .uri(serviceUri())
            .security(secure().orElse(null))
            .metadata(metadata())
            .version(version().orElse(null))
            .interfaces(interfaces())
            .build();
    }
}
