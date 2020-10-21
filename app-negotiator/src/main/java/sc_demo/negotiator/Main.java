package sc_demo.negotiator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import se.arkalix.ArSystem;
import se.arkalix.core.plugin.HttpJsonCloudPlugin;
import se.arkalix.core.plugin.cp.*;
import se.arkalix.descriptor.EncodingDescriptor;
import se.arkalix.dto.DtoWritable;
import se.arkalix.dto.json.value.JsonObject;
import se.arkalix.internal.core.plugin.Paths;
import se.arkalix.net.http.HttpStatus;
import se.arkalix.net.http.consumer.HttpConsumer;
import se.arkalix.net.http.consumer.HttpConsumerRequest;
import se.arkalix.net.http.service.HttpRouteHandler;
import se.arkalix.net.http.service.HttpService;
import se.arkalix.net.http.service.HttpServiceRequestException;
import se.arkalix.security.identity.OwnedIdentity;
import se.arkalix.security.identity.TrustStore;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;

import static se.arkalix.descriptor.EncodingDescriptor.JSON;
import static se.arkalix.net.http.HttpMethod.GET;
import static se.arkalix.net.http.HttpStatus.NO_CONTENT;
import static se.arkalix.net.http.HttpStatus.OK;
import static se.arkalix.security.access.AccessPolicy.cloud;
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
                    new HttpJsonTrustedContractNegotiatorPlugin())
                .build();

            logger.info("Productive 4.0 Supply Chain Demonstrator - " + system.name());

            final var me = config.me();
            final var parties = config.parties();
            final var templates = config.templates();

            final var inboxEntries = new LinkedList<ClientInboxEntryDto>();
            final var offerResponders = new ConcurrentHashMap<Long, TrustedContractNegotiatorResponder>();
            final var negotiator = system.pluginFacadeOf(HttpJsonTrustedContractObserverPlugin.class)
                .map(f -> (ArTrustedContractNegotiatorPluginFacade) f)
                .orElseThrow(() -> new IllegalStateException("No " +
                    "ArTrustedContractNegotiatorPluginFacade is " +
                    "available; cannot observe negotiations"));

            final var negotiationHandler = new TrustedContractNegotiatorHandler() {
                @Override
                public void onAccept(final TrustedContractNegotiationDto negotiation) {
                    inboxEntries.addLast(new ClientInboxEntryBuilder()
                        .type(ClientInboxEntry.Type.OFFER_ACCEPT)
                        .id(negotiation.id())
                        .offer(negotiation.offer())
                        .build());

                    collectDefinitionsForNegotiationWith(negotiation.id());
                }

                @Override
                public void onOffer(
                    final TrustedContractNegotiationDto negotiation,
                    final TrustedContractNegotiatorResponder responder
                ) {
                    offerResponders.put(negotiation.id(), responder);
                    inboxEntries.addLast(new ClientInboxEntryBuilder()
                        .type(ClientInboxEntry.Type.OFFER_SUBMIT)
                        .id(negotiation.id())
                        .offer(negotiation.offer())
                        .build());

                    collectDefinitionsForNegotiationWith(negotiation.id());
                }

                @Override
                public void onReject(final TrustedContractNegotiationDto negotiation) {
                    inboxEntries.addLast(new ClientInboxEntryBuilder()
                        .type(ClientInboxEntry.Type.OFFER_REJECT)
                        .id(negotiation.id())
                        .offer(negotiation.offer())
                        .build());

                    collectDefinitionsForNegotiationWith(negotiation.id());
                }

                @Override
                public void onExpiry(final long negotiationId) {
                    inboxEntries.addLast(new ClientInboxEntryBuilder()
                        .type(ClientInboxEntry.Type.OFFER_EXPIRY)
                        .id(negotiationId)
                        .build());

                    TrustedContractNegotiatorHandler.super.onExpiry(negotiationId);
                }

                @Override
                public void onFault(final long negotiationId, final Throwable throwable) {
                    inboxEntries.addLast(new ClientInboxEntryBuilder()
                        .type(ClientInboxEntry.Type.OFFER_FAULT)
                        .id(negotiationId)
                        .error(throwable.getMessage())
                        .build());

                    TrustedContractNegotiatorHandler.super.onFault(negotiationId, throwable);
                }

                private void collectDefinitionsForNegotiationWith(final long negotiationId) {
                    system.consume()
                        .name("trusted-contract-negotiation")
                        .encodings(JSON)
                        .oneUsing(HttpConsumer.factory())
                        .flatMap(consumer -> consumer.send(new HttpConsumerRequest()
                            .method(GET)
                            .path(Paths.combine(consumer.service().uri(), "definitions"))
                            .queryParameter("id", negotiationId)))
                        .flatMap(response -> response.bodyAsListIfSuccess(JsonObject.class))
                        .ifSuccess(definitions -> definitions
                            .forEach(definition -> inboxEntries
                                .addLast(new ClientInboxEntryBuilder()
                                    .type(ClientInboxEntry.Type.DEFINITION)
                                    .id(negotiationId)
                                    .definition(definition)
                                    .build())))
                        .onFailure(fault -> logger.error("Failed to acquire " +
                            "definitions related to negotiation " +
                            negotiationId, fault));
                }
            };

            system.provide(new HttpService()
                .name("negotiator-ui")
                .encodings(JSON,
                    EncodingDescriptor.getOrCreate("SVG"),
                    EncodingDescriptor.getOrCreate("HTML"),
                    EncodingDescriptor.getOrCreate("JS"),
                    EncodingDescriptor.getOrCreate("CSS"))
                .accessPolicy(cloud())
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
                    final var list = new ArrayList<ClientInboxEntryDto>(inboxEntries.size());
                    ClientInboxEntryDto entry;
                    while ((entry = inboxEntries.pollFirst()) != null) {
                        list.add(entry);
                    }
                    response
                        .status(OK)
                        .body(list);
                    return done();
                })

                .post("/offers", (request, response) -> request
                    .bodyAs(ClientOfferDto.class)
                    .flatMap(offer -> negotiator.offer(
                        me.name(),
                        offer.receiver(),
                        Duration.ofMinutes(3),
                        List.of(new TrustedContractBuilder()
                            .templateName(offer.template().name())
                            .arguments(offer.contract())
                            .build()),
                        negotiationHandler))
                    .ifSuccess(id -> response
                        .status(OK)
                        .body(new ClientIdBuilder().id(id).build())))

                .post("/acceptances", (request, response) -> request
                    .bodyAs(ClientOfferDto.class)
                    .flatMap(offer -> offerResponders.get(offer.id()
                        .orElseThrow(() -> new HttpServiceRequestException(HttpStatus.BAD_REQUEST)))
                        .accept())
                    .ifSuccess(ignored -> response.status(NO_CONTENT)))

                .post("/counter-offers", (request, response) -> request
                    .bodyAs(ClientOfferDto.class)
                    .flatMap(offer -> offerResponders.get(offer.id()
                        .orElseThrow(() -> new HttpServiceRequestException(HttpStatus.BAD_REQUEST)))
                        .offer(new SimplifiedContractCounterOffer.Builder()
                            .validFor(Duration.ofMinutes(3))
                            .contracts(new TrustedContractBuilder()
                                .templateName(offer.template().name())
                                .arguments(offer.contract())
                                .build())
                            .build()))
                    .ifSuccess(ignored -> response.status(NO_CONTENT)))

                .post("/rejections", (request, response) -> request
                    .bodyAs(ClientOfferDto.class)
                    .flatMap(offer -> offerResponders.get(offer.id()
                        .orElseThrow(() -> new HttpServiceRequestException(HttpStatus.BAD_REQUEST)))
                        .reject())
                    .ifSuccess(ignored -> response.status(NO_CONTENT))))

                .onFailure(Main::panic);

            negotiator.listen(me.name(), () -> negotiationHandler);
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
