package sc_demo.supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import sc_demo.common.Config;

import java.util.logging.Level;

import static sc_demo.common.Config.SUPPLIER_HOSTNAME;
import static sc_demo.common.Config.SUPPLIER_PORT;

public class Main {
    private static final Logger logger = LoggerFactory.getLogger(Main.class);

    public static void main(final String[] args) {
        logger.info("Productive 4.0 Supply Chain Demonstrator - Component Supplier ({}:{})", SUPPLIER_HOSTNAME, SUPPLIER_PORT);
    }

    static {
        Config.setupLogger(Level.INFO);
    }
}
