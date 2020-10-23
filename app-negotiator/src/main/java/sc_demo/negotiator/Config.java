package sc_demo.negotiator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.FileInputStream;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

@SuppressWarnings("SameParameterValue")
public class Config {
    private static final Logger logger = LoggerFactory.getLogger(Config.class);

    private final Properties properties;
    private final String path;

    private Config(final Properties properties, final String path) {
        this.properties = properties;
        this.path = path;
    }

    public static Config readAt(final String path) {
        final var properties = new Properties();
        try {
            properties.load(new FileInputStream(path));
        }
        catch (final Exception exception) {
            throw new RuntimeException(exception);
        }
        return new Config(properties, path);
    }

    public Path keyStorePath() {
        return Path.of(getStringOrThrow("app.keystore.path"));
    }

    public char[] keyStorePassword() {
        return getStringOrThrow("app.keystore.password").toCharArray();
    }

    public String keyAliasOrNull() {
        return getString("app.key.alias", null);
    }

    public char[] keyPassword() {
        return getStringOrThrow("app.key.password").toCharArray();
    }

    public Path trustStorePath() {
        return Path.of(getStringOrThrow("app.truststore.path"));
    }

    public char[] trustStorePassword() {
        return getStringOrThrow("app.truststore.password").toCharArray();
    }

    public InetSocketAddress localSocketAddress() {
        final var hostname = getString("app.hostname", null);
        final var port = getInt("app.port", 0);
        return hostname != null
            ? new InetSocketAddress(hostname, port)
            : new InetSocketAddress(port);
    }

    public InetSocketAddress serviceRegistrySocketAddress() {
        final var hostname = getStringOrThrow("sr.hostname");
        final var port = getIntOrThrow("sr.port");
        return new InetSocketAddress(hostname, port);
    }

    public ClientPartyDto me() {
        return new ClientPartyBuilder()
            .name(getStringOrThrow("app.me.name"))
            .label(getStringOrThrow("app.me.label"))
            .build();
    }

    public List<ClientPartyDto> parties() {
        final var list = new ArrayList<ClientPartyDto>();

        final var raw = getStringOrThrow("app.parties");
        final var pairs = raw.split(",");
        for (final var pair : pairs) {
            final var parts = pair.split(":", 2);
            final var name = parts[0].trim();
            final var label = parts.length == 2 ? parts[1].trim() : name;
            list.add(new ClientPartyBuilder()
                .name(name)
                .label(label)
                .build());
        }

        return list;
    }

    public List<ClientTemplateDto> templates() {
        final var list = new ArrayList<ClientTemplateDto>();

        final var raw = getStringOrThrow("app.templates");
        final var pairs = raw.split(",");
        for (final var pair : pairs) {
            final var parts = pair.split(":", 2);
            final var pathString = parts[0].trim();
            try {
                final var text = Files.readString(Path.of(pathString), StandardCharsets.UTF_8);
                final var label = parts.length == 2 ? parts[1].trim() : pathString;
                list.add(new ClientTemplateBuilder()
                    .name(Path.of(pathString).getFileName().toString())
                    .label(label)
                    .text(text)
                    .build());
            }
            catch (final IOException exception) {
                logger.error("Failed to access template at '" + pathString + "'", exception);
            }
        }

        return list;
    }

    private String getString(final String name, final String defaultValue) {
        final var property = properties.getProperty(name);
        if (property == null) {
            return defaultValue;
        }
        return property;
    }

    private String getStringOrThrow(final String name) {
        final var property = properties.getProperty(name);
        if (property == null) {
            throw new IllegalStateException("Property '" + name + "' not specified in '" + path + "'");
        }
        return property;
    }

    private int getInt(final String name, final int defaultValue) {
        final var property = properties.getProperty(name);
        if (property == null) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(property);
        }
        catch (final NumberFormatException exception) {
            throw new IllegalStateException("Property '" + name + "' not a valid integer in '" + path + "'", exception);
        }
    }

    private int getIntOrThrow(final String name) {
        final var property = getStringOrThrow(name);
        try {
            return Integer.parseInt(property);
        }
        catch (final NumberFormatException exception) {
            throw new IllegalStateException("Property '" + name + "' not a valid integer in '" + path + "'", exception);
        }
    }
}
