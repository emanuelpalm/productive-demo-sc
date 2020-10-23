package sc_demo.sysop.data;

import se.arkalix.dto.DtoReadableAs;

import java.net.InetSocketAddress;
import java.util.List;

import static se.arkalix.dto.DtoEncoding.JSON;

@DtoReadableAs(JSON)
public interface Config {
    String serviceRegistryHost();

    default InetSocketAddress serviceRegistrySocketAddress() {
        final var host = serviceRegistryHost();
        final var lastColonIndex = host.lastIndexOf(':');
        final var hostname = host.substring(0, lastColonIndex);
        final var port = Integer.parseInt(host.substring(lastColonIndex + 1));
        return new InetSocketAddress(hostname, port);
    }

    List<CfProvider> providers();

    List<CfService> services();

    List<CfConsumptionRule> rules();
}
