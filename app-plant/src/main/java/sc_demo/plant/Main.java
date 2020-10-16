package sc_demo.plant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import sc_demo.common.Config;

import java.util.logging.Level;

import static sc_demo.common.Config.PLANT_HOSTNAME;
import static sc_demo.common.Config.PLANT_PORT;

public class Main {
    private static final Logger logger = LoggerFactory.getLogger(Main.class);

    public static void main(final String[] args) {
        logger.info("Productive 4.0 Supply Chain Demonstrator - Final Assembly Plant ({}:{})", PLANT_HOSTNAME, PLANT_PORT);
    }

    static {
        Config.setupLogger(Level.INFO);
    }
}
