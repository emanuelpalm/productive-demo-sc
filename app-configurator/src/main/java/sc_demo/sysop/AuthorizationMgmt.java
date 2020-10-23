package sc_demo.sysop;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import se.arkalix.net.MessageIncoming;
import se.arkalix.net.http.client.HttpClient;
import se.arkalix.net.http.client.HttpClientRequest;
import se.arkalix.util.concurrent.Future;
import se.arkalix.util.concurrent.Futures;
import sc_demo.sysop.data.AuMgmtRuleIntraBuilder;
import sc_demo.sysop.data.CfConsumptionRule;

import java.net.InetSocketAddress;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import static se.arkalix.dto.DtoEncoding.JSON;
import static se.arkalix.net.http.HttpMethod.POST;

public class AuthorizationMgmt {
    private static final Logger logger = LoggerFactory.getLogger(AuthorizationMgmt.class);

    private final HttpClient client;
    private final InetSocketAddress authorizationHost;
    private final ServiceRegistryCache registry;

    public AuthorizationMgmt(final HttpClient client, final InetSocketAddress authorizationHost, final ServiceRegistryCache registry) {
        this.client = Objects.requireNonNull(client);
        this.authorizationHost = Objects.requireNonNull(authorizationHost);
        this.registry = Objects.requireNonNull(registry);
    }

    public Future<?> register(final List<CfConsumptionRule> rules) {
        return Futures.serialize(rules.stream().map(rule -> client
            .send(authorizationHost, new HttpClientRequest()
                .method(POST)
                .uri("/authorization/mgmt/intracloud")
                .body(JSON, new AuMgmtRuleIntraBuilder()
                    .consumerId(registry.getSystemIdByNameOrThrow(rule.consumer()))
                    .interfaceIds(rule.services()
                        .stream()
                        .map(registry::getInterfaceIdByServiceNameOrThrow)
                        .distinct()
                        .collect(Collectors.toUnmodifiableList()))
                    .serviceDefinitionIds(rule.services()
                        .stream()
                        .map(registry::getServiceIdByNameOrThrow)
                        .collect(Collectors.toList()))
                    .providerIds(rule.providers()
                        .stream()
                        .map(registry::getSystemIdByNameOrThrow)
                        .collect(Collectors.toList()))
                    .build()))
            .flatMap(MessageIncoming::bodyAsString)
            .ifSuccess(body -> {
                logger.info("Created authorization rule {}", rule);
                logger.debug("Response: {}", body);
            })
            .ifFailure(Throwable.class, throwable ->
                logger.warn("Failed to create authorization rule from " + rule, throwable))));
    }
}
