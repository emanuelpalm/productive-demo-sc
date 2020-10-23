package sc_demo.sysop;

import sc_demo.sysop.data.ConfigDto;
import se.arkalix.dto.binary.ByteArrayReader;
import se.arkalix.net.http.client.HttpClient;
import se.arkalix.security.identity.OwnedIdentity;
import se.arkalix.security.identity.TrustStore;
import se.arkalix.util.concurrent.Futures;

import java.net.ServerSocket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.logging.Level;

public class Main {
    public static void main(final String[] args) {
        try {
            final var password = new char[]{'1', '2', '3', '4', '5', '6'};
            final var client = new HttpClient.Builder()
                .identity(new OwnedIdentity.Loader()
                    .keyStorePath("keystore.p12")
                    .keyStorePassword(password)
                    .keyPassword(password)
                    .load())
                .trustStore(TrustStore.read("truststore.p12", password))
                .build();

            final var configPath = "config.json";
            final var bytes = Files.readAllBytes(Path.of(configPath));
            final var reader = new ByteArrayReader(bytes);
            final var config = ConfigDto.readJson(reader);

            final var srSocketAddress = config.serviceRegistrySocketAddress();

            final var serviceRegistry = new ServiceRegistryMgmt(client, srSocketAddress);

            serviceRegistry.register(config.services(), config.providers())
                .flatMap(ignored -> {
                    final var cache = new ServiceRegistryCache(client, srSocketAddress);
                    return cache.refresh()
                        .pass(cache);
                })
                .flatMap(cache -> {
                    final var auSocketAddress = cache.getProviderByNameOrThrow("authorization").socketAddress();
                    final var orSocketAddress = cache.getProviderByNameOrThrow("orchestrator").socketAddress();

                    final var authorization = new AuthorizationMgmt(client, auSocketAddress, cache);
                    final var orchestrator = new OrchestratorMgmt(client, orSocketAddress, cache);

                    return Futures.serialize(List.of(
                        authorization.register(config.rules()),
                        orchestrator.register(config.rules())));
                })
                .fork(ignored -> {
                    // Allow for other systems to determine if configuration is
                    // done by connecting to port 9999 via TCP.
                    try {
                        final ServerSocket server;
                        server = new ServerSocket(9999);
                        while (!Thread.interrupted()) {
                            try {
                                server.accept().close();
                            }
                            catch (final Throwable throwable) {
                                throwable.printStackTrace(System.err);
                            }
                        }
                    }
                    catch (final Throwable throwable) {
                        throwable.printStackTrace(System.err);
                    }
                })
                .onFailure(Main::panic);

        }
        catch (final Throwable throwable) {
            panic(throwable);
        }
    }

    private static void panic(final Throwable throwable) {
        System.err.println("Failed to start Sysop Configurator; unexpected exception thrown during startup");
        throwable.printStackTrace(System.err);
    }

    static {
        final var logLevel = Level.INFO;
        System.setProperty("java.util.logging.SimpleFormatter.format", "%1$tF %1$tT %4$s %5$s%6$s%n");
        final var root = java.util.logging.Logger.getLogger("");
        root.setLevel(logLevel);
        for (final var handler : root.getHandlers()) {
            handler.setLevel(logLevel);
        }
    }
}
