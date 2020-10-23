package sc_demo.sysop;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import sc_demo.sysop.data.CfProvider;
import se.arkalix.net.MessageIncoming;
import se.arkalix.net.http.client.HttpClient;
import se.arkalix.net.http.client.HttpClientRequest;
import se.arkalix.util.concurrent.Future;
import se.arkalix.util.concurrent.Futures;
import sc_demo.sysop.data.CfService;

import java.net.InetSocketAddress;
import java.util.List;
import java.util.Objects;

import static se.arkalix.dto.DtoEncoding.JSON;
import static se.arkalix.net.http.HttpMethod.POST;

public class ServiceRegistryMgmt {
    private static final Logger logger = LoggerFactory.getLogger(ServiceRegistryMgmt.class);

    private final HttpClient client;
    private final InetSocketAddress serviceRegistryHost;

    public ServiceRegistryMgmt(final HttpClient client, final InetSocketAddress serviceRegistryHost) {
        this.client = Objects.requireNonNull(client);
        this.serviceRegistryHost = Objects.requireNonNull(serviceRegistryHost);
    }

    public Future<?> register(final List<CfService> services, final List<CfProvider> providers) {
        return Futures.serialize(services.stream().map(service -> client
            .send(serviceRegistryHost, new HttpClientRequest()
                .method(POST)
                .uri("/serviceregistry/mgmt")
                .body(JSON, service.toRegistrationUsing(providers)))
            .flatMap(MessageIncoming::bodyAsString)
            .ifSuccess(body -> {
                logger.info("Created service entry {}/{}",
                    providers.get(service.providerIndex()).systemName(),
                    service.serviceDefinition());
                logger.debug("Response: {}", body);
            })
            .ifFailure(Throwable.class, throwable ->
                logger.warn("Failed to create authorization rule from " + service, throwable))));
    }
}
