package sc_demo.negotiator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import se.arkalix.ArSystem;
import se.arkalix.core.plugin.HttpJsonCloudPlugin;
import se.arkalix.core.plugin.cp.HttpJsonTrustedContractObserverPlugin;
import se.arkalix.descriptor.EncodingDescriptor;
import se.arkalix.dto.DtoWritable;
import se.arkalix.net.http.service.HttpRouteHandler;
import se.arkalix.net.http.service.HttpService;
import se.arkalix.security.access.AccessPolicy;
import se.arkalix.security.identity.OwnedIdentity;
import se.arkalix.security.identity.TrustStore;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.Objects;
import java.util.logging.Level;

import static se.arkalix.descriptor.EncodingDescriptor.JSON;
import static se.arkalix.net.http.HttpStatus.OK;
import static se.arkalix.util.concurrent.Future.done;

public class Main {
    private static final Logger logger = LoggerFactory.getLogger(Main.class);

    private static final byte[] bankSvg = readResourceAsBytes("bank.svg");
    private static final byte[] indexHtml = readResourceAsBytes("index.html");
    private static final byte[] ledgerSvg = readResourceAsBytes("ledger.svg");
    private static final byte[] mainJs = readResourceAsBytes("main.js");
    private static final byte[] messengerSvg = readResourceAsBytes("messenger.svg");
    private static final byte[] screenCss = readResourceAsBytes("screen.css");

    public static void main(final String[] args) {
        try {
            final var config = Config.readAt(args.length > 0
                ? args[0]
                : "application.properties");

            final var system = new ArSystem.Builder()
                .identity(new OwnedIdentity.Loader()
                    .keyStorePath(config.keyStorePath())
                    .keyStorePassword(config.keyStorePassword())
                    .keyAlias(config.keyAliasOrNull())
                    .keyPassword(config.keyPassword())
                    .load())
                .trustStore(TrustStore.read(config.trustStorePath(), config.trustStorePassword()))
                .localSocketAddress(config.localSocketAddress())
                .plugins(
                    new HttpJsonCloudPlugin.Builder()
                        .serviceRegistrationPredicate(service -> service.interfaces()
                            .stream()
                            .allMatch(i -> i.encoding().isDto()))
                        .serviceRegistrySocketAddress(config.serviceRegistrySocketAddress())
                        .build(),
                    new HttpJsonTrustedContractObserverPlugin())
                .build();

            logger.info("Productive 4.0 Supply Chain Demonstrator - " + system.name());

            final var me = config.me();
            final var parties = config.parties();
            final var templates = config.templates();

            system.provide(new HttpService()
                .name("negotiator-ui")
                .encodings(JSON,
                    EncodingDescriptor.getOrCreate("SVG"),
                    EncodingDescriptor.getOrCreate("HTML"),
                    EncodingDescriptor.getOrCreate("JS"),
                    EncodingDescriptor.getOrCreate("CSS"))
                .accessPolicy(AccessPolicy.cloud())
                .basePath("/ui")

                .get("/bank.svg", serve(bankSvg))
                .get("/index.html", serve(indexHtml))
                .get("/ledger.svg", serve(ledgerSvg))
                .get("/main.js", serve(mainJs))
                .get("/messenger.svg", serve(messengerSvg))
                .get("/screen.css", serve(screenCss))

                .get("/me", serve(me))
                .get("/parties", serve(parties))
                .get("/templates", serve(templates))

                .delete("/inbox/entries", (request, response) -> {
                    // TODO
                    return done();
                })

                .post("/offers", (request, response) -> {
                    // TODO
                    return done();
                })

                .post("/acceptances", (request, response) -> {
                    // TODO
                    return done();
                })

                .post("/counter-offers", (request, response) -> {
                    // TODO
                    return done();
                })

                .post("/rejections", (request, response) -> {
                    // TODO
                    return done();
                })
            )
                .onFailure(Main::panic);

        }
        catch (final Throwable throwable) {
            panic(throwable);
        }
    }

    private static byte[] readResourceAsBytes(final String path) {
        try {
            return Objects.requireNonNull(Main.class
                .getClassLoader()
                .getResourceAsStream(path))
                .readAllBytes();
        }
        catch (final IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }

    private static HttpRouteHandler serve(final byte[] data) {
        return (request, response) -> {
            response.status(OK).body(data);
            return done();
        };
    }

    private static HttpRouteHandler serve(final DtoWritable data) {
        return (request, response) -> {
            response.status(OK).body(data);
            return done();
        };
    }

    private static HttpRouteHandler serve(final List<? extends DtoWritable> data) {
        return (request, response) -> {
            response.status(OK).body(data);
            return done();
        };
    }

    private static void panic(final Throwable throwable) {
        System.err.println("Failed to start application");
        throwable.printStackTrace(System.err);
        System.exit(1);
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
