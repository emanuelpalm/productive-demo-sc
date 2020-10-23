package sc_demo.sysop;

import se.arkalix.net.http.client.HttpClient;
import se.arkalix.net.http.client.HttpClientRequest;
import se.arkalix.util.concurrent.Future;
import sc_demo.sysop.data.SrMgmtProvider;
import sc_demo.sysop.data.SrMgmtQueryResultDto;

import java.net.InetSocketAddress;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

import static se.arkalix.dto.DtoEncoding.JSON;
import static se.arkalix.net.http.HttpMethod.GET;

public class ServiceRegistryCache {
    private final Map<String, Integer> serviceNameToId = new ConcurrentHashMap<>();
    private final Map<String, Integer> serviceNameToInterfaceId = new ConcurrentHashMap<>();
    private final Map<String, String> serviceNameToInterfaceName = new ConcurrentHashMap<>();
    private final Map<String, Integer> systemNameToId = new ConcurrentHashMap<>();
    private final Map<String, SrMgmtProvider> systemNameToProvider = new ConcurrentHashMap<>();

    private final HttpClient client;
    private final InetSocketAddress serviceRegistryHost;

    public ServiceRegistryCache(final HttpClient client, final InetSocketAddress serviceRegistryHost) {
        this.client = Objects.requireNonNull(client);
        this.serviceRegistryHost = Objects.requireNonNull(serviceRegistryHost);
    }

    public int getInterfaceIdByServiceNameOrThrow(final String name) {
        final var id = serviceNameToInterfaceId.get(name);
        if (id == null) {
            throw new IllegalStateException("No interface associated with service \"" + name + "\" exists in registry");
        }
        return id;
    }

    public String getInterfaceNameByServiceNameOrThrow(final String name) {
        final var n = serviceNameToInterfaceName.get(name);
        if (n == null) {
            throw new IllegalStateException("No interface associated with service \"" + name + "\" exists in registry");
        }
        return n;
    }

    public int getServiceIdByNameOrThrow(final String name) {
        final var id = serviceNameToId.get(name);
        if (id == null) {
            throw new IllegalStateException("No service named \"" + name + "\" exists in registry");
        }
        return id;
    }

    public int getSystemIdByNameOrThrow(final String name) {
        final var id = systemNameToId.get(name);
        if (id == null) {
            throw new IllegalStateException("No system named \"" + name + "\" exists in registry");
        }
        return id;
    }

    public SrMgmtProvider getProviderByNameOrThrow(final String name) {
        final var provider = systemNameToProvider.get(name);
        if (provider == null) {
            throw new IllegalStateException("No system named \"" + name + "\" exists in registry");
        }
        return provider;
    }

    public Future<?> refresh() {
        return client.send(serviceRegistryHost, new HttpClientRequest().method(GET).uri("/serviceregistry/mgmt"))
            .flatMap(response -> response.bodyAsIfSuccess(JSON, SrMgmtQueryResultDto.class))
            .ifSuccess(result -> result.data().forEach(entry -> {
                final var sd = entry.serviceDefinition();
                serviceNameToId.put(sd.serviceDefinition(), sd.id());

                if (entry.interfaces().size() > 0) {
                    final var entryInterface = entry.interfaces().get(0);
                    serviceNameToInterfaceId.put(sd.serviceDefinition(), entryInterface.id());
                    serviceNameToInterfaceName.put(sd.serviceDefinition(), entryInterface.interfaceName());
                }

                final var p = entry.provider();
                systemNameToId.put(p.systemName(), p.id());
                systemNameToProvider.put(p.systemName(), p);
            }));
    }
}