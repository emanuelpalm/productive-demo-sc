package sc_demo.common;

import java.util.logging.Level;

public class Config {
    private Config() {}

    public static final String PLANT_HOSTNAME = "sys-plant.uni";
    public static final int PLANT_PORT = 9001;

    public static final String CARRIER_HOSTNAME = "sys-carrier.uni";
    public static final int CARRIER_PORT = 9002;

    public static final String SUPPLIER_HOSTNAME = "sys-supplier.uni";
    public static final int SUPPLIER_PORT = 9003;

    public static final String SR_HOSTNAME = "service-registry.uni";
    public static final int SR_PORT = 8443;

    public static void setupLogger(final Level logLevel) {
        System.setProperty("java.util.logging.SimpleFormatter.format", "%1$tF %1$tT %4$s %5$s%6$s%n");
        final var root = java.util.logging.Logger.getLogger("");
        root.setLevel(logLevel);
        for (final var handler : root.getHandlers()) {
            handler.setLevel(logLevel);
        }
    }
}
