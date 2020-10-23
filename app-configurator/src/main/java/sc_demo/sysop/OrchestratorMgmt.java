package sc_demo.sysop;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import sc_demo.sysop.data.OrMgmtProviderBuilder;
import sc_demo.sysop.data.OrMgmtRuleBuilder;
import se.arkalix.net.MessageIncoming;
import se.arkalix.net.http.client.HttpClient;
import se.arkalix.net.http.client.HttpClientRequest;
import se.arkalix.util.concurrent.Future;
import sc_demo.sysop.data.CfConsumptionRule;

import java.net.InetSocketAddress;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import static se.arkalix.dto.DtoEncoding.JSON;
import static se.arkalix.net.http.HttpMethod.POST;

public class OrchestratorMgmt {
    private static final Logger logger = LoggerFactory.getLogger(OrchestratorMgmt.class);

    private final HttpClient client;
    private final InetSocketAddress orchestratorHost;
    private final ServiceRegistryCache registry;

    public OrchestratorMgmt(final HttpClient client, final InetSocketAddress orchestratorHost, final ServiceRegistryCache registry) {
        this.client = Objects.requireNonNull(client);
        this.orchestratorHost = Objects.requireNonNull(orchestratorHost);
        this.registry = Objects.requireNonNull(registry);
    }

    public Future<?> register(final List<CfConsumptionRule> rules) {
        return client.send(orchestratorHost, new HttpClientRequest()
            .method(POST)
            .uri("/orchestrator/mgmt/store")
            .body(JSON, rules.stream()
                .flatMap(rule -> rule.providers()
                    .stream()
                    .flatMap(providerName -> {
                        final var srProvider = registry.getProviderByNameOrThrow(providerName);
                        final var orProvider = new OrMgmtProviderBuilder()
                            .address(srProvider.address())
                            .authenticationInfo(srProvider.authenticationInfo())
                            .port(srProvider.port())
                            .systemName(srProvider.systemName())
                            .build();

                        return rule.services()
                            .stream()
                            .map(serviceName -> new OrMgmtRuleBuilder()
                                .consumerSystemId(registry.getSystemIdByNameOrThrow(rule.consumer()))
                                .priority(0)
                                .providerSystem(orProvider)
                                .serviceDefinitionName(serviceName)
                                .serviceInterfaceName(registry.getInterfaceNameByServiceNameOrThrow(serviceName))
                                .build());
                    }))
                .collect(Collectors.toList())))
            .flatMap(MessageIncoming::bodyAsString)
            .ifSuccess(body -> {
                logger.info("Created orchestration rules {}", rules);
                logger.debug("Response: {}", body);
            })
            .ifFailure(Throwable.class, throwable ->
                logger.warn("Failed to create orchestration rules from " + rules, throwable));
    }
}
